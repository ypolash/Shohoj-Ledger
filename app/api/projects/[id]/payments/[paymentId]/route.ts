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
      where: { id: projectId, companyId }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const paymentAmount = Number(payment.amount || 0);

    await prisma.$transaction(async (tx: any) => {
      // 1. Delete associated Income records created for this payment
      await tx.income.deleteMany({
        where: {
          projectId: project.id,
          category: { in: ["Project Payment", "Project Profit", "Advance Payment", "Project Final Payment"] },
          amount: paymentAmount
        }
      });

      // 2. Delete the ProjectPayment record
      await tx.projectPayment.delete({
        where: { id: paymentId }
      });

      // 3. Log activity
      await tx.projectActivity.create({
        data: {
          companyId,
          projectId: project.id,
          type: "PAYMENT_DELETED",
          description: `Deleted client payment of ৳${paymentAmount.toLocaleString()} (${payment.paymentMethod}).`,
          performedById: session.user.id
        }
      });
    });

    return NextResponse.json({ success: true, message: "Payment deleted successfully" });
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
      where: { id: projectId, companyId }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const oldAmount = Number(payment.amount || 0);

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. If custom cost was entered
      if (newCustomCost > 0) {
        const currentActualCost = Number(project.actualCost || 0);
        await tx.project.update({
          where: { id: project.id },
          data: {
            actualCost: currentActualCost + newCustomCost
          }
        });

        const costExpense = await tx.expense.create({
          data: {
            companyId,
            projectId: project.id,
            category: "Project Custom Cost",
            amount: newCustomCost,
            paymentMethod: newPaymentMethod,
            approvalStatus: "APPROVED",
            description: newCostReason
              ? `Project "${project.name}" custom cost: ${newCostReason}`
              : `Project "${project.name}" cost recorded with payment`,
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
          description: `Project Cost: ${newCostReason || 'Custom Cost'} (${project.name})`,
          createdById: session.user.id,
          systemSource: "ERP"
        });
      }

      // 2. Adjust Income record
      const lowerNotes = (newNotes || "").toLowerCase();
      const isAdvance = lowerNotes.includes("advance");
      const isFinal = lowerNotes.includes("settlement") || lowerNotes.includes("final") || lowerNotes.includes("completion");

      let incomeLabel = "Payment";
      if (isAdvance) {
        incomeLabel = "Advance";
      } else if (isFinal) {
        incomeLabel = "Final Payment";
      }

      const cleanNotes = (newNotes || "")
        .replace(/^\[Advance Payment\]/i, '')
        .replace(/^\[Advance\]/i, '')
        .replace(/^\[Full Settlement\]/i, '')
        .replace(/^\[Partial Settlement\]/i, '')
        .replace(/\[Custom Cost:[^\]]*\]/gi, '')
        .trim();

      const incomeDesc = `${project.name} ${incomeLabel} ${newAmount}${cleanNotes ? ` (${cleanNotes})` : ''}`;

      const income = await tx.income.findFirst({
        where: {
          projectId: project.id,
          category: { in: ["Project Payment", "Project Profit", "Advance Payment", "Project Final Payment"] },
          amount: oldAmount
        }
      });

      if (income) {
        await tx.income.update({
          where: { id: income.id },
          data: {
            amount: newAmount,
            received: newAmount,
            source: newPaymentMethod,
            description: incomeDesc
          }
        });
      }

      // Clean base notes
      let cleanNote = newNotes;
      if (cleanNote.includes('[Custom Cost:')) {
        cleanNote = cleanNote.replace(/\[Custom Cost:[^\]]*\]/gi, '').trim();
      }

      let formattedNotes = cleanNote || "";
      if (newCustomCost > 0) {
        const costTag = `[Custom Cost: -৳${newCustomCost.toLocaleString()}${newCostReason ? ` (${newCostReason})` : ''}]`;
        formattedNotes = formattedNotes ? `${formattedNotes} • ${costTag}` : costTag;
      }

      // 3. Update payment record
      const updatedPayment = await tx.projectPayment.update({
        where: { id: paymentId },
        data: {
          amount: newAmount,
          paymentMethod: newPaymentMethod,
          notes: formattedNotes || null,
          paidToStaff: 0,
          profit: newAmount,
          ...(newDate ? { createdAt: newDate } : {})
        }
      });

      // 4. Activity log
      await tx.projectActivity.create({
        data: {
          companyId,
          projectId: project.id,
          type: "PAYMENT_UPDATED",
          description: `Updated client payment to ৳${newAmount.toLocaleString()} (${newPaymentMethod}).`,
          performedById: session.user.id
        }
      });

      return {
        payment: updatedPayment
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
