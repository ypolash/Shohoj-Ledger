import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules/moduleGuard";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(request: Request) {
  const rbacGuard = await requirePermission("FINANCE_VIEW");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ACCOUNTING");
  if (moduleGuard) return moduleGuard;

  try {
    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const loans = await prisma.memberLoan.findMany({
      where: { companyId: companyIdForGuard, systemSource },
      orderBy: { createdAt: 'desc' }
    });

    const userIds = loans.map(l => l.memberId);
    const members = await prisma.member.findMany({
      where: { ...(await withCompany()), id: { in: userIds } },
      select: { id: true, name: true }
    });

    const userMap = members.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {} as Record<string, string>);

    const now = new Date();

    const loansWithDetails = loans.map(loan => {
      // Respect stored dueDate or calculate standard fallback
      const dueDate = loan.dueDate ? new Date(loan.dueDate) : new Date(new Date(loan.issueDate).setMonth(new Date(loan.issueDate).getMonth() + 6));
      const isOverdue = loan.status === "ACTIVE" && now > dueDate && Number(loan.remainingAmount) > 0;

      return {
        ...loan,
        memberName: userMap[loan.memberId] || "Unknown Member",
        dueDate: dueDate.toISOString(),
        isOverdue
      };
    });

    return NextResponse.json(loansWithDetails);
  } catch (error) {
    console.error("Error fetching loans:", error);
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 });
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
    const { memberId, amount, description, tenureMonths = 6, dueDate: customDueDate } = body;

    if (!memberId || amount === undefined) {
      return NextResponse.json({ error: "Missing memberId or amount" }, { status: 400 });
    }

    const targetMember = await prisma.member.findFirst({
      where: { id: memberId, companyId: companyIdForGuard }
    });
    if (!targetMember) {
      return NextResponse.json({ error: "Unauthorized cross-tenant reference or member not found" }, { status: 403 });
    }

    const loanAmount = parseFloat(amount);
    const issueDate = new Date();
    let dueDate = customDueDate ? new Date(customDueDate) : new Date(issueDate);
    if (!customDueDate) {
      dueDate.setMonth(dueDate.getMonth() + Number(tenureMonths));
    }

    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const loan = await prisma.memberLoan.create({
      data: {
        companyId: companyIdForGuard,
        memberId,
        amount: loanAmount,
        remainingAmount: loanAmount,
        status: "ACTIVE",
        reason: description,
        issueDate,
        dueDate,
        systemSource
      }
    });

    const { createLedgerEntry } = await import("@/lib/ledger");
    const { getSession } = await import("@/lib/session");
    const session = await getSession();

    await createLedgerEntry({
      companyId: companyIdForGuard,
      module: 'Loan',
      referenceId: loan.id,
      amount: loanAmount,
      isDebit: false, // Credit Bank (Cash leaves the company)
      accountType: 'Bank', 
      description: `Loan Issued to Member: ${description || ''}`,
      createdById: session?.user?.id
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json({ error: "Failed to issue loan" }, { status: 500 });
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
    const { id, status, repaymentAmount } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing loan ID" }, { status: 400 });
    }
    
    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";
    
    const oldLoan = await prisma.memberLoan.findFirst({
      where: { id, companyId: companyIdForGuard, systemSource }
    });

    if (!oldLoan) {
      return NextResponse.json({ error: "Loan not found or access denied" }, { status: 404 });
    }

    let newRemaining = Number(oldLoan.remainingAmount);
    let repaidAmountRecorded = 0;

    // Handle partial repayment
    if (repaymentAmount && Number(repaymentAmount) > 0) {
      const repayAmt = Number(repaymentAmount);
      repaidAmountRecorded = Math.min(newRemaining, repayAmt);
      newRemaining = Math.max(0, newRemaining - repayAmt);
    } else if (status === "REPAID" || status === "DEDUCTED") {
      repaidAmountRecorded = newRemaining;
      newRemaining = 0;
    }

    const newStatus = newRemaining === 0 ? "REPAID" : (status || oldLoan.status);

    const updatedLoan = await prisma.memberLoan.update({
      where: { id },
      data: {
        remainingAmount: newRemaining,
        status: newStatus
      }
    });

    // Record ledger repayment
    if (repaidAmountRecorded > 0) {
      const { createLedgerEntry } = await import("@/lib/ledger");
      const { getSession } = await import("@/lib/session");
      const session = await getSession();

      await createLedgerEntry({
        companyId: companyIdForGuard,
        module: 'Loan',
        referenceId: updatedLoan.id,
        amount: repaidAmountRecorded,
        isDebit: true, // Debit Bank (Cash received into company)
        accountType: 'Bank', 
        description: `Loan Repayment Received from Member (${newStatus})`,
        createdById: session?.user?.id
      });
    }

    return NextResponse.json(updatedLoan);
  } catch (error) {
    console.error("Error updating loan status:", error);
    return NextResponse.json({ error: "Failed to update loan status" }, { status: 500 });
  }
}
