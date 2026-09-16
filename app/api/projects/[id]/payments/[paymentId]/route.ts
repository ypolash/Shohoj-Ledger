import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { verifyOwnership } from "@/lib/company/verifyOwnership";
import { createLedgerEntry } from "@/lib/ledger";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string; paymentId: string }> }
) {
  const params = await context.params;
  const { id: projectId, paymentId } = params;

  try {
    const ownershipGuard = await verifyOwnership("project", projectId);
    if (ownershipGuard) return ownershipGuard;

    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EDIT_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const payment = await prisma.projectPayment.findFirst({
      where: { id: paymentId, projectId }
    });

    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId },
      include: {
        projectEmployees: {
          where: { isProjectBased: true }
        }
      }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Extract custom cost from notes if present
    const costMatch = payment.notes?.match(/\[Custom Cost:\s*(-?৳?[0-9,]+(?:\.[0-9]+)?)/i);
    let extractedCost = 0;
    if (costMatch) {
      extractedCost = parseFloat(costMatch[1].replace(/[^-0-9.]/g, '')) || 0;
      if (extractedCost < 0) extractedCost = Math.abs(extractedCost);
    }

    const paidToStaff = Number(payment.paidToStaff || 0);

    await prisma.$transaction(async (tx: any) => {
      // 1. If custom cost was deducted from estimatedBudget, restore it
      const currentBudget = Number(project.estimatedBudget || 0);
      const currentActualCost = Number(project.actualCost || 0);
      const newBudget = currentBudget + extractedCost;
      const newActualCost = Math.max(0, currentActualCost - extractedCost - paidToStaff);

      await tx.project.update({
        where: { id: project.id },
        data: {
          estimatedBudget: newBudget,
          actualCost: newActualCost
        }
      });

      // 2. Delete associated Expense records created during this payment
      if (extractedCost > 0) {
        await tx.expense.deleteMany({
          where: {
            projectId: project.id,
            category: "Project Custom Cost",
            amount: extractedCost,
            description: { contains: "during client payment" }
          }
        });
      }

      if (paidToStaff > 0) {
        await tx.expense.deleteMany({
          where: {
            projectId: project.id,
            category: "Project Staff Payout",
            description: { contains: `Project "${project.name}" due cutting` }
          }
        });
      }

      // 3. Delete associated Income records created for this payment
      const profit = Number(payment.profit || 0);
      if (profit > 0) {
        await tx.income.deleteMany({
          where: {
            projectId: project.id,
            category: "Project Profit",
            amount: profit,
            description: { contains: `Net profit from Project "${project.name}" payment` }
          }
        });
      }

      // 4. Delete the ProjectPayment record
      await tx.projectPayment.delete({
        where: { id: paymentId }
      });

      // 5. Recalculate and synchronize ProjectEmployee paidAmount based on remaining payments
      const remainingPayments = await tx.projectPayment.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "asc" }
      });

      const totalRemainingStaffPaid = remainingPayments.reduce(
        (sum: number, p: any) => sum + Number(p.paidToStaff || 0),
        0
      );

      // Re-distribute remaining paidAmount across project-based staff
      let pool = totalRemainingStaffPaid;
      for (const pe of project.projectEmployees) {
        const rate = Number(pe.rate || 0);
        const allocated = Math.min(rate, pool);
        pool -= allocated;
        await tx.projectEmployee.update({
          where: { id: pe.id },
          data: { paidAmount: allocated }
        });
      }

      // 6. Log activity
      await tx.projectActivity.create({
        data: {
          companyId,
          projectId: project.id,
          type: "PAYMENT_DELETED",
          description: `Deleted payment of ৳${Number(payment.amount).toLocaleString()} (${payment.paymentMethod}). Financial balances reverted.`,
          performedById: session.user.id
        }
      });
    });

    return NextResponse.json({ success: true, message: "Payment deleted and balances adjusted successfully" });
  } catch (error) {
    console.error("DELETE Project Payment Error:", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string; paymentId: string }> }
) {
  const params = await context.params;
  const { id: projectId, paymentId } = params;

  try {
    const ownershipGuard = await verifyOwnership("project", projectId);
    if (ownershipGuard) return ownershipGuard;

    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EDIT_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const newAmount = parseFloat(body.amount);
    const newPaymentMethod = body.paymentMethod || "Bank Transfer";
    const newNotes = body.notes !== undefined ? body.notes : "";
    const newDate = body.date ? new Date(body.date) : undefined;
    const newCustomCost = Math.max(0, parseFloat(body.customCost) || 0);
    const newCostReason = (body.costReason || "").trim();

    if (isNaN(newAmount) || newAmount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const payment = await prisma.projectPayment.findFirst({
      where: { id: paymentId, projectId }
    });

    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId },
      include: {
        projectEmployees: {
          where: { isProjectBased: true },
          include: {
            employee: { select: { id: true, firstName: true, lastName: true } }
          }
        }
      }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Extract old custom cost from old notes
    const oldCostMatch = payment.notes?.match(/\[Custom Cost:\s*(-?৳?[0-9,]+(?:\.[0-9]+)?)/i);
    let oldCustomCost = 0;
    if (oldCostMatch) {
      oldCustomCost = parseFloat(oldCostMatch[1].replace(/[^-0-9.]/g, '')) || 0;
      if (oldCustomCost < 0) oldCustomCost = Math.abs(oldCustomCost);
    }
    const oldPaidToStaff = Number(payment.paidToStaff || 0);

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Temporarily revert old payment effects on project
      const currentBudget = Number(project.estimatedBudget || 0);
      const currentActualCost = Number(project.actualCost || 0);
      const restoredBudget = currentBudget + oldCustomCost;
      const restoredActualCost = Math.max(0, currentActualCost - oldCustomCost - oldPaidToStaff);

      // Clean up old associated expenses and incomes for this payment
      if (oldCustomCost > 0) {
        await tx.expense.deleteMany({
          where: {
            projectId: project.id,
            category: "Project Custom Cost",
            amount: oldCustomCost,
            description: { contains: "during client payment" }
          }
        });
      }
      if (oldPaidToStaff > 0) {
        await tx.expense.deleteMany({
          where: {
            projectId: project.id,
            category: "Project Staff Payout",
            description: { contains: `Project "${project.name}" due cutting` }
          }
        });
      }
      const oldProfit = Number(payment.profit || 0);
      if (oldProfit > 0) {
        await tx.income.deleteMany({
          where: {
            projectId: project.id,
            category: "Project Profit",
            amount: oldProfit,
            description: { contains: `Net profit from Project "${project.name}" payment` }
          }
        });
      }

      // Calculate dues based on remaining payments
      const otherPayments = await tx.projectPayment.findMany({
        where: { projectId: project.id, id: { not: paymentId } }
      });
      const otherPaidToStaff = otherPayments.reduce((s: number, p: any) => s + Number(p.paidToStaff || 0), 0);

      // Distribute other payments to get baseline paid amounts
      let pool = otherPaidToStaff;
      const baselineStaff = (project.projectEmployees || []).map((pe: any) => {
        const rate = Number(pe.rate || 0);
        const paid = Math.min(rate, pool);
        pool -= paid;
        const due = Math.max(0, rate - paid);
        return { ...pe, numericRate: rate, baselinePaid: paid, due };
      }).filter((s: any) => s.due > 0);

      const totalStaffDue = baselineStaff.reduce((sum: number, s: any) => sum + s.due, 0);

      let staffPayoutTotal = 0;
      const employeePayouts: any[] = [];

      if (totalStaffDue > 0 && newAmount > 0) {
        if (newAmount >= totalStaffDue) {
          for (const s of baselineStaff) {
            const payout = s.due;
            staffPayoutTotal += payout;
            await tx.projectEmployee.update({
              where: { id: s.id },
              data: { paidAmount: s.numericRate }
            });
            employeePayouts.push({
              projectEmployeeId: s.id,
              employeeName: `${s.employee.firstName} ${s.employee.lastName}`,
              payoutAmount: payout
            });
          }
        } else {
          let allocated = 0;
          for (let i = 0; i < baselineStaff.length; i++) {
            const s: any = baselineStaff[i];
            let payout = 0;
            if (i === baselineStaff.length - 1) {
              payout = Math.max(0, Math.round((newAmount - allocated) * 100) / 100);
            } else {
              payout = Math.floor((s.due / totalStaffDue) * newAmount * 100) / 100;
              allocated += payout;
            }
            staffPayoutTotal += payout;
            await tx.projectEmployee.update({
              where: { id: s.id },
              data: { paidAmount: s.baselinePaid + payout }
            });
            employeePayouts.push({
              projectEmployeeId: s.id,
              employeeName: `${s.employee.firstName} ${s.employee.lastName}`,
              payoutAmount: payout
            });
          }
        }

        // Create new Expenses & Ledger for staff payout
        for (const ep of employeePayouts) {
          if (ep.payoutAmount > 0) {
            const expense = await tx.expense.create({
              data: {
                companyId,
                projectId: project.id,
                category: "Project Staff Payout",
                amount: ep.payoutAmount,
                paymentMethod: newPaymentMethod,
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
              accountType: newPaymentMethod,
              description: `Expense Paid: Project Staff Payout (${ep.employeeName} - ${project.name})`,
              createdById: session.user.id,
              systemSource: "ERP"
            });
          }
        }
      }

      // Net profit
      const profit = Math.max(0, newAmount - staffPayoutTotal);
      if (profit > 0) {
        const income = await tx.income.create({
          data: {
            companyId,
            projectId: project.id,
            category: "Project Profit",
            source: newPaymentMethod,
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
          accountType: newPaymentMethod,
          description: `Income Received: Project Profit (${project.name})`,
          createdById: session.user.id,
          systemSource: "ERP"
        });
      }

      // Custom cost handling
      const updatedBudget = newCustomCost > 0 ? Math.max(0, restoredBudget - newCustomCost) : restoredBudget;
      const updatedActualCost = restoredActualCost + staffPayoutTotal + newCustomCost;

      await tx.project.update({
        where: { id: project.id },
        data: {
          estimatedBudget: updatedBudget,
          actualCost: updatedActualCost
        }
      });

      if (newCustomCost > 0) {
        const costExpense = await tx.expense.create({
          data: {
            companyId,
            projectId: project.id,
            category: "Project Custom Cost",
            amount: newCustomCost,
            paymentMethod: newPaymentMethod,
            approvalStatus: "APPROVED",
            description: newCostReason
              ? `Project "${project.name}" custom cost: ${newCostReason} (deducted from budget)`
              : `Project "${project.name}" custom cost deducted from budget during client payment`,
            systemSource: "ERP"
          }
        });

        await createLedgerEntry({
          companyId,
          module: "Expense",
          referenceId: costExpense.id,
          amount: newCustomCost,
          isDebit: false,
          accountType: newPaymentMethod,
          description: `Project Cost: ${newCostReason || 'Custom Cost'} deducted from budget (${project.name})`,
          createdById: session.user.id,
          systemSource: "ERP"
        });
      }

      // Clean base notes (remove old tag if any)
      let cleanNote = newNotes;
      if (cleanNote.includes('[Custom Cost:')) {
        cleanNote = cleanNote.replace(/\[Custom Cost:[^\]]*\]/gi, '').trim();
      }

      let formattedNotes = cleanNote || "";
      if (newCustomCost > 0) {
        const costTag = `[Custom Cost: -৳${newCustomCost.toLocaleString()}${newCostReason ? ` (${newCostReason})` : ''} • New Budget: ৳${updatedBudget.toLocaleString()}]`;
        formattedNotes = formattedNotes ? `${formattedNotes} • ${costTag}` : costTag;
      }

      const updatedPayment = await tx.projectPayment.update({
        where: { id: paymentId },
        data: {
          amount: newAmount,
          paymentMethod: newPaymentMethod,
          notes: formattedNotes || null,
          paidToStaff: staffPayoutTotal,
          profit,
          ...(newDate ? { createdAt: newDate } : {})
        }
      });

      // Activity log
      await tx.projectActivity.create({
        data: {
          companyId,
          projectId: project.id,
          type: "PAYMENT_UPDATED",
          description: `Updated payment to ৳${newAmount.toLocaleString()} (${newPaymentMethod}). Staff: ৳${staffPayoutTotal.toLocaleString()}, Profit: ৳${profit.toLocaleString()}`,
          performedById: session.user.id
        }
      });

      return {
        payment: updatedPayment,
        updatedBudget,
        updatedActualCost
      };
    });

    return NextResponse.json({
      success: true,
      message: "Payment updated successfully",
      ...result
    });
  } catch (error) {
    console.error("PATCH Project Payment Error:", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}
