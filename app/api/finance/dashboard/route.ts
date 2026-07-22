import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules/moduleGuard";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  const companyIdForGuard = await getCompanyId();
  if (!companyIdForGuard) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rbacGuard = await requirePermission("FINANCE_VIEW");
  if (rbacGuard) return rbacGuard;

  const moduleGuard = await requireModule(companyIdForGuard, "ACCOUNTING");
  if (moduleGuard) return moduleGuard;

  try {
    const whereClause = { ...(await withCompany()) };

    const ledgers = await prisma.ledgerEntry.findMany({
      where: whereClause,
      select: { debit: true, credit: true, module: true, accountType: true, date: true }
    });

    // KPIs
    let totalIncome = 0;
    let totalExpense = 0;
    let totalPayroll = 0;
    
    let totalCashIn = 0;
    let totalCashOut = 0;

    let cashBalance = 0;
    let bankBalance = 0;
    let reserveBalance = 0;

    // Chart Data
    const monthlyData: Record<string, { income: number; expense: number; profit: number }> = {};
    
    ledgers.forEach(l => {
      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);
      const net = debit - credit;
      const netCredit = credit - debit;

      // KPI Aggregation
      if (l.accountType === 'CASH' || l.accountType === 'BANK') {
        totalCashIn += debit;
        totalCashOut += credit;
      }
      if (l.accountType === 'CASH') cashBalance += net;
      if (l.accountType === 'BANK') bankBalance += net;
      if (l.accountType === 'RESERVE') reserveBalance += netCredit;

      if (l.module === 'INCOME' || l.module === 'Income') totalIncome += netCredit; // Income increases on Credit
      if (l.module === 'EXPENSE' || l.module === 'Expense') totalExpense += net; // Expense increases on Debit
      if (l.module === 'PAYROLL' || l.module === 'Payroll') totalPayroll += net; // Payroll increases on Debit

      // Chart Aggregation (Monthly)
      const monthKey = `${l.date.getFullYear()}-${(l.date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0, profit: 0 };
      }

      if (l.module === 'INCOME' || l.module === 'Income') monthlyData[monthKey].income += netCredit;
      if (l.module === 'EXPENSE' || l.module === 'Expense') monthlyData[monthKey].expense += net;
      if (l.module === 'PAYROLL' || l.module === 'Payroll') monthlyData[monthKey].expense += net;
    });

    Object.keys(monthlyData).forEach(m => {
      monthlyData[m].profit = monthlyData[m].income - monthlyData[m].expense;
    });

    const netCashFlow = totalCashIn - totalCashOut;
    const profit = totalIncome - totalExpense - totalPayroll;

    // Outstanding Loans & Advances
    const loans = await prisma.memberLoan.aggregate({
      where: whereClause, _sum: { remainingAmount: true }
    });
    const advances = await prisma.advance.aggregate({
      where: whereClause, _sum: { remainingAmount: true }
    });

    // Categories Breakdown
    const expenseCategories = await prisma.expense.groupBy({
      by: ['category'],
      where: whereClause,
      _sum: { amount: true }
    });
    
    const revenueCategories = await prisma.income.groupBy({
      by: ['category'],
      where: whereClause,
      _sum: { amount: true }
    });

    return NextResponse.json({
      kpis: {
        revenue: totalIncome,
        expenses: totalExpense,
        profit,
        cash: cashBalance,
        bank: bankBalance,
        reserve: reserveBalance,
        payroll: totalPayroll,
        loanOutstanding: loans._sum.remainingAmount || 0,
        advanceOutstanding: advances._sum.remainingAmount || 0,
        cashFlow: netCashFlow
      },
      charts: {
        monthlyData,
        expenseCategories: expenseCategories.map(c => ({ label: c.category, value: Number(c._sum.amount || 0) })),
        revenueCategories: revenueCategories.map(c => ({ label: c.category, value: Number(c._sum.amount || 0) }))
      }
    });
  } catch (error) {
    console.error("Error fetching finance dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch finance dashboard stats" }, { status: 500 });
  }
}
