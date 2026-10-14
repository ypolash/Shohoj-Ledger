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

    const { searchParams } = new URL(request.url);
    const filterLoanType = searchParams.get('loanType'); // 'CORPORATE' | 'MEMBER' | 'ALL'

    const where: any = { companyId: companyIdForGuard, systemSource: { in: ["ERP", "LEGACY"] } };
    if (filterLoanType && filterLoanType !== 'ALL') {
      where.loanType = filterLoanType;
    }

    const loans = await prisma.memberLoan.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const userIds = loans.map(l => l.memberId).filter(id => id && id.length > 10);
    const members = await prisma.member.findMany({
      where: { ...(await withCompany()), id: { in: userIds } },
      select: { id: true, name: true }
    });

    const userMap = members.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {} as Record<string, string>);

    const now = new Date();

    const loansWithDetails = loans.map((loan: any) => {
      // Respect stored dueDate or calculate standard fallback
      const dueDate = loan.dueDate ? new Date(loan.dueDate) : new Date(new Date(loan.issueDate).setMonth(new Date(loan.issueDate).getMonth() + 6));
      const isOverdue = loan.status === "ACTIVE" && now > dueDate && Number(loan.remainingAmount) > 0;
      const bankOrMember = loan.bankName || userMap[loan.memberId] || loan.memberId || "Corporate Facility";

      return {
        ...loan,
        bankName: loan.bankName || bankOrMember,
        facilityType: loan.facilityType || "Term Loan",
        interestRate: Number(loan.interestRate || 0),
        loanType: loan.loanType || (loan.bankName ? "CORPORATE" : "MEMBER"),
        memberName: bankOrMember,
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
    const {
      memberId,
      bankName,
      facilityType = "Term Loan",
      interestRate = 0,
      loanType = "CORPORATE",
      amount,
      description,
      tenureMonths = 12,
      issueDate: customIssueDate,
      dueDate: customDueDate
    } = body;

    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Valid loan amount is required" }, { status: 400 });
    }

    const loanAmount = parseFloat(amount);
    const issueDate = customIssueDate ? new Date(customIssueDate) : new Date();
    let dueDate = customDueDate ? new Date(customDueDate) : new Date(issueDate);
    if (!customDueDate) {
      dueDate.setMonth(dueDate.getMonth() + Number(tenureMonths));
    }

    const finalBankName = bankName || (memberId ? undefined : "Corporate Bank");
    let targetMemberId = memberId || finalBankName || "Corporate Facility";

    if (loanType === "MEMBER" && memberId) {
      const targetMember = await prisma.member.findFirst({
        where: { id: memberId, companyId: companyIdForGuard }
      });
      if (!targetMember) {
        return NextResponse.json({ error: "Unauthorized cross-tenant reference or member not found" }, { status: 403 });
      }
      targetMemberId = targetMember.id;
    }

    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const loan: any = await (prisma.memberLoan as any).create({
      data: {
        companyId: companyIdForGuard,
        memberId: targetMemberId,
        bankName: finalBankName,
        facilityType,
        interestRate: Number(interestRate) || 0,
        loanType: finalBankName ? "CORPORATE" : loanType,
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

    const isCorporate = (loan.loanType === 'CORPORATE') || Boolean(finalBankName);

    await createLedgerEntry({
      companyId: companyIdForGuard,
      module: 'Loan',
      referenceId: loan.id,
      amount: loanAmount,
      isDebit: isCorporate, // Corporate loan: funds received into Bank (Debit)
      accountType: 'Bank', 
      description: isCorporate
        ? `Corporate Facility Disbursed (${finalBankName || 'Bank'} - ${facilityType}): ${description || ''}`
        : `Loan Issued to Member: ${description || ''}`,
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

export async function DELETE(request: Request) {
  const rbacGuard = await requirePermission("FINANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  if (!companyIdForGuard) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing loan ID" }, { status: 400 });

    const existing = await prisma.memberLoan.findFirst({
      where: { id, companyId: companyIdForGuard }
    });
    if (!existing) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

    await prisma.memberLoan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting loan:", err);
    return NextResponse.json({ error: "Failed to delete loan" }, { status: 500 });
  }
}

