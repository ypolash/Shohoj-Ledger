import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { verifyOwnership } from "@/lib/company/verifyOwnership";
import { createLedgerEntry } from "@/lib/ledger";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const projectId = params.id;

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const project: any = await (prisma.project as any).findFirst({
      where: { id: projectId, companyId },
      include: {
        payments: {
          orderBy: { createdAt: "desc" }
        },
        projectEmployees: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                designation: true,
                employmentType: true,
                basicSalary: true
              }
            }
          }
        }
      }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Fetch associated expenses for this project
    const expenses = await prisma.expense.findMany({
      where: { projectId, companyId },
      orderBy: { createdAt: "desc" }
    });

    // Incomes
    const incomes = await prisma.income.findMany({
      where: { projectId, companyId },
      orderBy: { createdAt: "desc" }
    });

    const budget = Number(project.estimatedBudget || 0);
    const paymentsList = (project.payments || []) as any[];
    const employeesList = (project.projectEmployees || []) as any[];

    const totalPaymentsReceived = paymentsList.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const clientDue = Math.max(0, budget - totalPaymentsReceived);

    const projectStaff = employeesList.filter((pe: any) => pe.isProjectBased);
    const totalStaffRate = projectStaff.reduce((sum: number, pe: any) => sum + Number(pe.rate || 0), 0);
    const totalStaffPaid = projectStaff.reduce((sum: number, pe: any) => sum + Number(pe.paidAmount || 0), 0);
    const totalStaffDue = Math.max(0, totalStaffRate - totalStaffPaid);

    const otherExpenses = expenses
      .filter((e: any) => e.category !== "Project Staff Payout")
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

    const netProfit = Math.max(0, totalPaymentsReceived - totalStaffPaid - otherExpenses);

    return NextResponse.json({
      budget,
      totalPaymentsReceived,
      clientDue,
      totalStaffRate,
      totalStaffPaid,
      totalStaffDue,
      otherExpenses,
      netProfit,
      payments: paymentsList,
      projectEmployees: employeesList,
      expenses,
      incomes
    });
  } catch (error) {
    console.error("GET Project Financials Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const projectId = params.id;

  try {
    const ownershipGuard = await verifyOwnership("project", projectId);
    if (ownershipGuard) return ownershipGuard;

    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EDIT_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const paymentAmount = parseFloat(body.amount);
    const customCost = Math.max(0, parseFloat(body.customCost) || 0);
    const costReason = (body.costReason || "").trim();
    const paymentMethod = body.paymentMethod || "Bank";
    const notes = body.notes || "";
    const paymentDate = body.date ? new Date(body.date) : new Date();

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const project: any = await (prisma.project as any).findFirst({
      where: { id: projectId, companyId },
      include: {
        projectEmployees: {
          where: { isProjectBased: true },
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Calculate dues for project-based employees
    const staffWithDues = ((project.projectEmployees || []) as any[]).map((pe: any) => {
      const rate = Number(pe.rate || 0);
      const paid = Number(pe.paidAmount || 0);
      const due = Math.max(0, rate - paid);
      return { ...pe, numericRate: rate, numericPaid: paid, due };
    }).filter((s: any) => s.due > 0);

    const totalStaffDue = staffWithDues.reduce((sum: number, s: any) => sum + s.due, 0);

    // Run in a single atomic transaction
    const result = await prisma.$transaction(async (tx: any) => {
      let staffPayoutTotal = 0;
      const employeePayouts: {
        projectEmployeeId: string;
        employeeId: string;
        employeeName: string;
        payoutAmount: number;
        remainingDue: number;
      }[] = [];

      if (totalStaffDue > 0 && paymentAmount > 0) {
        if (paymentAmount >= totalStaffDue) {
          // Full payment: All staff dues are completely paid
          for (const s of staffWithDues) {
            const payout = s.due;
            staffPayoutTotal += payout;

            await tx.projectEmployee.update({
              where: { id: s.id },
              data: { paidAmount: s.numericRate }
            });

            employeePayouts.push({
              projectEmployeeId: s.id,
              employeeId: s.employeeId,
              employeeName: `${s.employee.firstName} ${s.employee.lastName}`,
              payoutAmount: payout,
              remainingDue: 0
            });
          }
        } else {
          // Partial payment: Proportional distribution
          let allocated = 0;
          for (let i = 0; i < staffWithDues.length; i++) {
            const s: any = staffWithDues[i];
            let payout = 0;
            if (i === staffWithDues.length - 1) {
              // Last employee receives remainder to avoid fractional cent discrepancy
              payout = Math.max(0, Math.round((paymentAmount - allocated) * 100) / 100);
            } else {
              payout = Math.floor((s.due / totalStaffDue) * paymentAmount * 100) / 100;
              allocated += payout;
            }

            staffPayoutTotal += payout;
            const newPaid = s.numericPaid + payout;
            const remDue = Math.max(0, s.numericRate - newPaid);

            await tx.projectEmployee.update({
              where: { id: s.id },
              data: { paidAmount: newPaid }
            });

            employeePayouts.push({
              projectEmployeeId: s.id,
              employeeId: s.employeeId,
              employeeName: `${s.employee.firstName} ${s.employee.lastName}`,
              payoutAmount: payout,
              remainingDue: remDue
            });
          }
        }

        // Save each employee payout as an Expense (Due cutting)
        for (const ep of employeePayouts) {
          if (ep.payoutAmount > 0) {
            const expense = await tx.expense.create({
              data: {
                companyId,
                projectId: project.id,
                category: "Project Staff Payout",
                amount: ep.payoutAmount,
                paymentMethod,
                approvalStatus: "APPROVED",
                description: `Project "${project.name}" due cutting / payout to ${ep.employeeName}`,
                systemSource: "ERP"
              }
            });

            await createLedgerEntry({
              companyId,
              module: "Expense",
              referenceId: expense.id,
              amount: ep.payoutAmount,
              isDebit: false,
              accountType: paymentMethod,
              description: `Expense Paid: Project Staff Payout (${ep.employeeName} - ${project.name})`,
              createdById: session.user.id,
              systemSource: "ERP"
            });
          }
        }
      }

      // Calculate Net Profit
      const profit = Math.max(0, paymentAmount - staffPayoutTotal);

      // Save Profit as Income
      if (profit > 0) {
        const income = await tx.income.create({
          data: {
            companyId,
            projectId: project.id,
            category: "Project Profit",
            source: paymentMethod,
            amount: profit,
            received: profit,
            paymentStatus: "PAID",
            shareable: true,
            description: `Net profit from Project "${project.name}" payment`,
            systemSource: "ERP"
          }
        });

        await createLedgerEntry({
          companyId,
          module: "Income",
          referenceId: income.id,
          amount: profit,
          isDebit: true,
          accountType: paymentMethod,
          description: `Income Received: Project Profit (${project.name})`,
          createdById: session.user.id,
          systemSource: "ERP"
        });
      }

      const currentBudget = Number(project.estimatedBudget || 0);
      let updatedBudget = currentBudget;
      const currentActualCost = Number(project.actualCost || 0);

      if (customCost > 0) {
        updatedBudget = Math.max(0, currentBudget - customCost);

        await tx.project.update({
          where: { id: project.id },
          data: {
            estimatedBudget: updatedBudget,
            actualCost: currentActualCost + customCost + staffPayoutTotal
          }
        });

        // Record custom cost as a project expense
        const costExpense = await tx.expense.create({
          data: {
            companyId,
            projectId: project.id,
            category: "Project Custom Cost",
            amount: customCost,
            paymentMethod,
            approvalStatus: "APPROVED",
            description: costReason
              ? `Project "${project.name}" custom cost: ${costReason} (deducted from budget)`
              : `Project "${project.name}" custom cost deducted from budget during client payment`,
            systemSource: "ERP"
          }
        });

        await createLedgerEntry({
          companyId,
          module: "Expense",
          referenceId: costExpense.id,
          amount: customCost,
          isDebit: false,
          accountType: paymentMethod,
          description: `Project Cost: ${costReason || 'Custom Cost'} deducted from budget (${project.name})`,
          createdById: session.user.id,
          systemSource: "ERP"
        });
      } else if (staffPayoutTotal > 0) {
        await tx.project.update({
          where: { id: project.id },
          data: { actualCost: currentActualCost + staffPayoutTotal }
        });
      }

      // Format payment notes
      let formattedNotes = notes || "";
      if (customCost > 0) {
        const costTag = `[Custom Cost: -৳${customCost.toLocaleString()}${costReason ? ` (${costReason})` : ''} • New Budget: ৳${updatedBudget.toLocaleString()}]`;
        formattedNotes = formattedNotes ? `${formattedNotes} • ${costTag}` : costTag;
      }

      // Record Project Payment Entry
      const paymentRecord = await tx.projectPayment.create({
        data: {
          projectId: project.id,
          amount: paymentAmount,
          paymentMethod,
          notes: formattedNotes || null,
          paidToStaff: staffPayoutTotal,
          profit,
          createdAt: paymentDate
        }
      });

      // Activity log
      let activityDesc = `Recorded payment of ৳${paymentAmount.toLocaleString()} (${paymentMethod}).`;
      if (customCost > 0) {
        activityDesc += ` Deducted custom cost of ৳${customCost.toLocaleString()} from budget (New Budget: ৳${updatedBudget.toLocaleString()}).`;
      }
      activityDesc += ` Auto-paid staff: ৳${staffPayoutTotal.toLocaleString()}, Net Profit: ৳${profit.toLocaleString()}`;

      await tx.projectActivity.create({
        data: {
          companyId,
          projectId: project.id,
          type: "PAYMENT_RECORDED",
          description: activityDesc,
          performedById: session.user.id
        }
      });

      return {
        paymentRecord,
        customCost,
        updatedBudget,
        staffPayoutTotal,
        profit,
        employeePayouts
      };
    });

    const costAmt = result.customCost || 0;
    return NextResponse.json({
      success: true,
      message: costAmt > 0 ? "Payment recorded & cost deducted from budget" : "Payment processed successfully",
      ...result
    }, { status: 201 });
  } catch (error) {
    console.error("POST Project Payment Error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
