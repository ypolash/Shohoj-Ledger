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
    const { type, name, amount, action, paymentMethod = "Bank Transfer" } = body;
    const talentAmount = Math.max(0, parseFloat(amount) || 0);
    const talentName = (name || "").trim();
    const talentType = type === "MODEL" ? "MODEL" : "EDITOR";
    const isPay = action === "PAY";

    if (talentAmount <= 0) {
      return NextResponse.json({ error: "Invalid settlement amount" }, { status: 400 });
    }

    const project: any = await (prisma.project as any).findFirst({
      where: { id: projectId, companyId }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const category = talentType === "MODEL" ? "Model Fee" : "Editor Fee";
    // Exact requested format: (Like oroject name Model 800) / (Project Name Editor 1500)
    const description = talentType === "MODEL"
      ? `${project.name} Model ${talentAmount}`
      : `${project.name} Editor ${talentAmount}`;

    const result = await prisma.$transaction(async (tx: any) => {
      const currentActualCost = Number(project.actualCost || 0);

      if (isPay) {
        // 1. Check if an expense already exists for this talent/project to avoid duplicates
        const existingExpense = await tx.expense.findFirst({
          where: {
            projectId: project.id,
            companyId,
            category,
            amount: talentAmount
          }
        });

        let expenseRecord = existingExpense;
        if (!existingExpense) {
          expenseRecord = await tx.expense.create({
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
        }

        // 2. Activity log
        await tx.projectActivity.create({
          data: {
            companyId,
            projectId: project.id,
            type: "TALENT_PAID",
            description: `Settled ${talentType.toLowerCase()} payment for ${talentName || talentType}: ৳${talentAmount.toLocaleString()} (${paymentMethod}).`,
            performedById: session.user.id
          }
        });

        return { expense: expenseRecord, actualCost: currentActualCost + (existingExpense ? 0 : talentAmount) };
      } else {
        // UNPAY: Revert expense and actualCost
        const existingExpense = await tx.expense.findFirst({
          where: {
            projectId: project.id,
            companyId,
            category,
            amount: talentAmount
          }
        });

        if (existingExpense) {
          await tx.expense.delete({
            where: { id: existingExpense.id }
          });

          await tx.project.update({
            where: { id: project.id },
            data: {
              actualCost: Math.max(0, currentActualCost - talentAmount)
            }
          });
        }

        // Activity log
        await tx.projectActivity.create({
          data: {
            companyId,
            projectId: project.id,
            type: "TALENT_UNPAID",
            description: `Reverted ${talentType.toLowerCase()} payment for ${talentName || talentType} (৳${talentAmount.toLocaleString()}).`,
            performedById: session.user.id
          }
        });

        return { actualCost: Math.max(0, currentActualCost - talentAmount) };
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
