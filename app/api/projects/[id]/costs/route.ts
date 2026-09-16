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
    const customCost = Math.max(0, parseFloat(body.amount) || 0);
    const costReason = (body.reason || "").trim();

    if (customCost <= 0) {
      return NextResponse.json({ error: "Invalid cost amount" }, { status: 400 });
    }

    const project: any = await (prisma.project as any).findFirst({
      where: { id: projectId, companyId }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const result = await prisma.$transaction(async (tx: any) => {
      const currentBudget = Number(project.estimatedBudget || 0);
      const updatedBudget = Math.max(0, currentBudget - customCost);

      const currentActualCost = Number(project.actualCost || 0);
      const updatedActualCost = currentActualCost + customCost;

      await tx.project.update({
        where: { id: project.id },
        data: {
          estimatedBudget: updatedBudget,
          actualCost: updatedActualCost
        }
      });

      // Record custom cost as a project expense
      const costExpense = await tx.expense.create({
        data: {
          companyId,
          projectId: project.id,
          category: "Project Custom Cost",
          amount: customCost,
          paymentMethod: "Cash", // Defaulting to Cash or could be selectable
          approvalStatus: "APPROVED",
          description: costReason
            ? `Project "${project.name}" custom cost: ${costReason} (deducted from budget)`
            : `Project "${project.name}" custom cost deducted from budget`,
          systemSource: "ERP"
        }
      });

      await createLedgerEntry({
        companyId,
        module: "Expense",
        referenceId: costExpense.id,
        amount: customCost,
        isDebit: false,
        accountType: "Cash",
        description: `Project Cost: ${costReason || 'Custom Cost'} deducted from budget (${project.name})`,
        createdById: session.user.id,
        systemSource: "ERP"
      });

      // Activity log
      const activityDesc = `Added project cost of ৳${customCost.toLocaleString()} ${costReason ? `(${costReason})` : ''}. Deducted from budget (New Budget: ৳${updatedBudget.toLocaleString()}).`;

      await tx.projectActivity.create({
        data: {
          companyId,
          projectId: project.id,
          type: "COST_RECORDED",
          description: activityDesc,
          performedById: session.user.id
        }
      });

      return {
        customCost,
        updatedBudget
      };
    });

    return NextResponse.json({
      success: true,
      message: "Cost recorded and budget updated successfully",
      ...result
    }, { status: 201 });
  } catch (error) {
    console.error("POST Project Cost Error:", error);
    return NextResponse.json({ error: "Failed to record cost" }, { status: 500 });
  }
}
