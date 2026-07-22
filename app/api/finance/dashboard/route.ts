import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules/moduleGuard";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  const rbacGuard = await requirePermission("FINANCE_VIEW");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ACCOUNTING");
  if (moduleGuard) return moduleGuard;

  try {
    const whereClause = { ...(await withCompany()) };

    // Group ledger entries by module and isDebit
    const ledgers = await prisma.ledgerEntry.findMany({
      where: whereClause,
      select: { amount: true, isDebit: true, module: true }
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let totalPayroll = 0;
    
    let totalDebit = 0;
    let totalCredit = 0;

    ledgers.forEach(l => {
      const amt = Number(l.amount);
      if (l.isDebit) {
        totalDebit += amt;
      } else {
        totalCredit += amt;
      }

      if (l.module === 'Income') totalIncome += amt;
      if (l.module === 'Expense') totalExpense += amt;
      if (l.module === 'Payroll') totalPayroll += amt;
    });

    const netCashFlow = totalDebit - totalCredit; // Assuming Debit = Cash In, Credit = Cash Out

    return NextResponse.json({
      totalIncome,
      totalExpense,
      totalPayroll,
      netCashFlow,
      totalDebit,
      totalCredit
    });
  } catch (error) {
    console.error("Error fetching finance dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch finance dashboard stats" }, { status: 500 });
  }
}
