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

    // Total actual expenses incurred for this project
    const totalCost = Number(project.actualCost || 0);

    // Realized Profit = Cash Received - Actual Costs
    const realizedProfit = totalPaymentsReceived - totalCost;
    const isLoss = realizedProfit < 0;
    const lossAmount = isLoss ? Math.abs(realizedProfit) : 0;

    // Projected Original Profit once client completes full contract payment
    const projectedProfit = budget - totalCost;

    return NextResponse.json({
      budget,
      totalPaymentsReceived,
      clientDue,
      totalCost,
      realizedProfit,
      isLoss,
      lossAmount,
      projectedProfit,
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
    const paymentMethod = body.paymentMethod || "Bank Transfer";
    const notes = body.notes || "";
    const paymentDate = body.date ? new Date(body.date) : new Date();

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const project: any = await (prisma.project as any).findFirst({
      where: { id: projectId, companyId }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Run in a single atomic transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Record Client Payment as Income with requested description format
      const lowerNotes = (notes || "").toLowerCase();
      const isAdvance = lowerNotes.includes("advance");
      const isFinal = lowerNotes.includes("settlement") || lowerNotes.includes("final") || lowerNotes.includes("completion");

      let incomeLabel = "Payment";
      if (isAdvance) {
        incomeLabel = "Advance";
      } else if (isFinal) {
        incomeLabel = "Final Payment";
      }

      const cleanNotes = (notes || "")
        .replace(/^\[Advance Payment\]/i, '')
        .replace(/^\[Advance\]/i, '')
        .replace(/^\[Full Settlement\]/i, '')
        .replace(/^\[Partial Settlement\]/i, '')
        .trim();

      // Exact format requested: (Project Name Advaced 1500)
      const incomeDesc = `${project.name} ${incomeLabel} ${paymentAmount}${cleanNotes ? ` (${cleanNotes})` : ''}`;

      const income = await tx.income.create({
        data: {
          companyId,
          projectId: project.id,
          category: isAdvance ? "Advance Payment" : isFinal ? "Project Final Payment" : "Project Payment",
          source: paymentMethod,
          amount: paymentAmount,
          received: paymentAmount,
          paymentStatus: "PAID",
          shareable: true,
          description: incomeDesc,
          systemSource: "ERP"
        }
      });

      await createLedgerEntry({
        companyId,
        module: "Income",
        referenceId: income.id,
        amount: paymentAmount,
        isDebit: true,
        accountType: paymentMethod,
        description: `Income: ${incomeDesc}`,
        createdById: session.user.id,
        systemSource: "ERP"
      });

      // 2. Handle optional custom cost entered during payment
      let currentActualCost = Number(project.actualCost || 0);
      let updatedActualCost = currentActualCost;

      if (customCost > 0) {
        updatedActualCost = currentActualCost + customCost;

        await tx.project.update({
          where: { id: project.id },
          data: {
            actualCost: updatedActualCost
          }
        });

        // Exact format requested: Project Name Cost Reason Amount
        const expenseDesc = costReason
          ? `${project.name} Cost - ${costReason} ${customCost}`
          : `${project.name} Cost ${customCost}`;

        // Record custom cost as a project expense
        const costExpense = await tx.expense.create({
          data: {
            companyId,
            projectId: project.id,
            category: "Project Custom Cost",
            amount: customCost,
            paymentMethod,
            approvalStatus: "APPROVED",
            description: expenseDesc,
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
          description: `Project Expense: ${expenseDesc}`,
          createdById: session.user.id,
          systemSource: "ERP"
        });
      }

      // Format payment notes
      let formattedNotes = notes || "";
      if (customCost > 0) {
        const costTag = `[Custom Cost: -৳${customCost.toLocaleString()}${costReason ? ` (${costReason})` : ''}]`;
        formattedNotes = formattedNotes ? `${formattedNotes} • ${costTag}` : costTag;
      }

      // 3. Record Project Payment Entry (paidToStaff is 0, profit reflects full payment received)
      const paymentRecord = await tx.projectPayment.create({
        data: {
          projectId: project.id,
          amount: paymentAmount,
          paymentMethod,
          notes: formattedNotes || null,
          paidToStaff: 0,
          profit: paymentAmount,
          createdAt: paymentDate
        }
      });

      // 4. Activity log
      let activityDesc = `Recorded client payment of ৳${paymentAmount.toLocaleString()} (${paymentMethod}).`;
      if (customCost > 0) {
        activityDesc += ` Added project cost of ৳${customCost.toLocaleString()} ${costReason ? `(${costReason})` : ''}.`;
      }

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
        updatedActualCost
      };
    });

    return NextResponse.json({
      success: true,
      message: "Client payment recorded successfully",
      ...result
    }, { status: 201 });
  } catch (error) {
    console.error("POST Project Payment Error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
