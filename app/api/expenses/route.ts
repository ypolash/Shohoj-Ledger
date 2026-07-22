import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules/moduleGuard";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { createLedgerEntry } from "@/lib/ledger";
import { getSession } from "@/lib/session";

export async function GET() {
  const rbacGuard = await requirePermission("FINANCE_VIEW");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ACCOUNTING");
  if (moduleGuard) return moduleGuard;

  try {
    const expenses = await prisma.expense.findMany({
      where: { ...(await withCompany()) },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("FINANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ACCOUNTING");
  if (moduleGuard) return moduleGuard;

  try {
    const body = await request.json();
    const { category, amount, paymentMethod, description, projectId } = body;

    if (!category || amount === undefined || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const expenseAmount = parseFloat(amount);

    const expense = await prisma.expense.create({
      data: {
        companyId: companyIdForGuard,
        category,
        amount: expenseAmount,
        paymentMethod,
        approvalStatus: "PENDING", // Default to pending
        description,
        projectId
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to record expense" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const rbacGuard = await requirePermission("FINANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ACCOUNTING");
  if (moduleGuard) return moduleGuard;

  try {
    const body = await request.json();
    const { id, approvalStatus } = body;

    if (!id || !approvalStatus) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const oldExpense = await prisma.expense.findUnique({
      where: { ...(await withCompany()), id }
    });

    if (!oldExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const updatedExpense = await prisma.expense.update({
      where: { ...(await withCompany()), id },
      data: { approvalStatus }
    });

    // If it was just approved, generate the Ledger Entry (Money Out)
    if (oldExpense.approvalStatus !== 'APPROVED' && approvalStatus === 'APPROVED') {
      const session = await getSession();
      await createLedgerEntry({
        companyId: companyIdForGuard,
        module: 'Expense',
        referenceId: updatedExpense.id,
        amount: Number(updatedExpense.amount),
        isDebit: false, // Credit Bank (Asset decreases)
        accountType: updatedExpense.paymentMethod || 'Bank',
        description: `Expense Approved: ${updatedExpense.category} ${updatedExpense.description ? '(' + updatedExpense.description + ')' : ''}`,
        createdById: session?.user?.id
      });
    } else if (oldExpense.approvalStatus === 'APPROVED' && approvalStatus !== 'APPROVED') {
      // Reversal/Refund if it was un-approved
      const session = await getSession();
      await createLedgerEntry({
        companyId: companyIdForGuard,
        module: 'Expense',
        referenceId: updatedExpense.id,
        amount: Number(updatedExpense.amount),
        isDebit: true, // Debit Bank (Asset returned)
        accountType: updatedExpense.paymentMethod || 'Bank',
        description: `Expense Un-approved (Reversed): ${updatedExpense.category}`,
        createdById: session?.user?.id
      });
    }

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Failed to update expense status" }, { status: 500 });
  }
}
