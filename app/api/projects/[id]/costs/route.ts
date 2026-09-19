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
      const currentActualCost = Number(project.actualCost || 0);
      const updatedActualCost = currentActualCost + customCost;

      await tx.project.update({
        where: { id: project.id },
        data: {
          actualCost: updatedActualCost
        }
      });

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
          paymentMethod: "Cash",
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
        accountType: "Cash",
        description: `Project Expense: ${expenseDesc}`,
        createdById: session.user.id,
        systemSource: "ERP"
      });

      // Activity log
      const activityDesc = `Added project cost of ৳${customCost.toLocaleString()} ${costReason ? `(${costReason})` : ''}. (Reduces net profit).`;

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
        customCost
      };
    });

    return NextResponse.json({
      success: true,
      message: "Cost recorded successfully",
      ...result
    }, { status: 201 });
  } catch (error) {
    console.error("POST Project Cost Error:", error);
    return NextResponse.json({ error: "Failed to record cost" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
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

    const url = new URL(req.url);
    const costId = url.searchParams.get("costId");

    if (!costId) {
      return NextResponse.json({ error: "Cost ID is required" }, { status: 400 });
    }

    const expense = await prisma.expense.findFirst({
      where: { id: costId, projectId, companyId, category: "Project Custom Cost" }
    });

    if (!expense) return NextResponse.json({ error: "Cost not found" }, { status: 404 });

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const costAmount = Number(expense.amount || 0);

    await prisma.$transaction(async (tx: any) => {
      // Revert actualCost on project
      const currentActualCost = Number(project.actualCost || 0);
      await tx.project.update({
        where: { id: project.id },
        data: {
          actualCost: Math.max(0, currentActualCost - costAmount)
        }
      });

      // Delete Expense record
      await tx.expense.delete({
        where: { id: costId }
      });

      // Activity log
      await tx.projectActivity.create({
        data: {
          companyId,
          projectId: project.id,
          type: "COST_DELETED",
          description: `Deleted custom cost of ৳${costAmount.toLocaleString()} (${expense.description || ''}).`,
          performedById: session.user.id
        }
      });
    });

    return NextResponse.json({ success: true, message: "Cost deleted successfully" });
  } catch (error) {
    console.error("DELETE Project Cost Error:", error);
    return NextResponse.json({ error: "Failed to delete cost" }, { status: 500 });
  }
}

