import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { verifyOwnership } from "@/lib/company/verifyOwnership";
import { createLedgerEntry } from "@/lib/ledger";

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
    const { type, name, amount, action, paymentMethod = "Bank Transfer", isPartial = false } = body;
    const talentAmount = Math.max(0, parseFloat(amount) || 0);
    const talentName = (name || "").trim();
    const talentType = type === "MODEL" ? "MODEL" : "EDITOR";
    const isPay = action === "PAY" || action === "PARTIAL_PAY";

    if (isPay && talentAmount <= 0) {
      return NextResponse.json({ error: "Invalid settlement amount" }, { status: 400 });
    }

    const project: any = await (prisma.project as any).findFirst({
      where: { id: projectId, companyId }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const category = talentType === "MODEL" ? "Model Fee" : "Editor Fee";
    const description = talentType === "MODEL"
      ? `${project.name} Model ${talentAmount}${isPartial ? ' (Partial)' : ''}`
      : `${project.name} Editor ${talentAmount}${isPartial ? ' (Partial)' : ''}`;

    const result = await prisma.$transaction(async (tx: any) => {
      const currentActualCost = Number(project.actualCost || 0);

      if (isPay) {
        // Create an Expense record for this payment
        const expenseRecord = await tx.expense.create({
          data: {
            companyId,
            projectId: project.id,
            category,
            amount: talentAmount,
            paymentMethod,
            approvalStatus: "APPROVED",
            description,
            systemSource: "ERP"
          }
        });

        await createLedgerEntry({
          companyId,
          module: "Expense",
          referenceId: expenseRecord.id,
          amount: talentAmount,
          isDebit: false,
          accountType: paymentMethod,
          description: `Project Expense: ${description}`,
          createdById: session.user.id,
          systemSource: "ERP"
        });

        // Update project actualCost
        await tx.project.update({
          where: { id: project.id },
          data: {
            actualCost: currentActualCost + talentAmount
          }
        });

        // Activity log
        await tx.projectActivity.create({
          data: {
            companyId,
            projectId: project.id,
            type: "TALENT_PAID",
            description: `Recorded ${isPartial ? 'partial' : 'full'} ${talentType.toLowerCase()} payment for ${talentName || talentType}: ৳${talentAmount.toLocaleString()} via ${paymentMethod}.`,
            performedById: session.user.id
          }
        });

        return { expense: expenseRecord, actualCost: currentActualCost + talentAmount };
      } else {
        // UNPAY / RESET: Revert expenses for this category on this project
        const expenses = await tx.expense.findMany({
          where: {
            projectId: project.id,
            companyId,
            category
          }
        });

        let totalReverted = 0;
        if (talentAmount > 0) {
          // Revert matching expense or up to talentAmount
          const targetExpense = expenses.find((e: any) => Number(e.amount) === talentAmount) || expenses[expenses.length - 1];
          if (targetExpense) {
            totalReverted = Number(targetExpense.amount);
            await tx.expense.delete({ where: { id: targetExpense.id } });
          }
        } else {
          // Revert all expenses in this category
          for (const exp of expenses) {
            totalReverted += Number(exp.amount);
            await tx.expense.delete({ where: { id: exp.id } });
          }
        }

        if (totalReverted > 0) {
          await tx.project.update({
            where: { id: project.id },
            data: {
              actualCost: Math.max(0, currentActualCost - totalReverted)
            }
          });
        }

        // Activity log
        await tx.projectActivity.create({
          data: {
            companyId,
            projectId: project.id,
            type: "TALENT_UNPAID",
            description: `Reverted ${talentType.toLowerCase()} payment for ${talentName || talentType} (৳${totalReverted.toLocaleString()}).`,
            performedById: session.user.id
          }
        });

        return { actualCost: Math.max(0, currentActualCost - totalReverted), totalReverted };
      }
    });

    return NextResponse.json({
      success: true,
      message: `${talentType} payment ${isPay ? 'recorded' : 'reverted'} successfully`,
      ...result
    });
  } catch (error) {
    console.error("Talent Settlement Error:", error);
    return NextResponse.json({ error: "Failed to process talent settlement" }, { status: 500 });
  }
}
