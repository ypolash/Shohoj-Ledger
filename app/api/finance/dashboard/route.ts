import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules/moduleGuard";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(request: Request) {
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
      select: { id: true, debit: true, credit: true, module: true, accountType: true, date: true, description: true, referenceId: true, status: true },
      orderBy: { date: 'desc' }
    });
    
    // We can use the first 5 ledgers for the recent transactions
    const recentTransactions = ledgers.slice(0, 5).map(l => ({
      id: l.referenceId || l.id,
      date: l.date,
      description: l.description || 'Ledger Entry',
      status: l.status || 'POSTED',
      credit: Number(l.credit || 0),
      debit: Number(l.debit || 0),
      type: Number(l.debit || 0) > 0 ? 'INCOME' : 'EXPENSE'
    }));

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
    const monthlyData: Record<string, { income: number; expense: number; profit: number; cashIn?: number; cashOut?: number }> = {};
    
    ledgers.forEach(l => {
      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);
      const net = debit - credit;       // Asset increase (debit) - Asset decrease (credit)
      const netCredit = credit - debit; // Asset decrease (credit) - Asset increase (debit)

      const accType = (l.accountType || '').toUpperCase();
      const mod = (l.module || '').toUpperCase();

      // KPI Aggregation
      if (accType.includes('CASH') || accType.includes('BANK')) {
        totalCashIn += debit;
        totalCashOut += credit;
      }
      
      if (accType.includes('CASH')) cashBalance += net;
      if (accType.includes('BANK')) bankBalance += net;
      if (accType.includes('RESERVE') || mod === 'RESERVE') reserveBalance += netCredit; // Reserve balance increases when Cash goes out (Credit)

      if (mod === 'INCOME') totalIncome += debit; // Income is money received (Debit)
      if (mod === 'EXPENSE') totalExpense += credit; // Expense is money paid (Credit)
      if (mod === 'PAYROLL') totalPayroll += credit; // Payroll is money paid (Credit)

      // Chart Aggregation (Monthly)
      const monthKey = `${l.date.getFullYear()}-${(l.date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0, profit: 0, cashIn: 0, cashOut: 0 };
      }

      if (accType.includes('CASH') || accType.includes('BANK')) {
        monthlyData[monthKey].cashIn = (monthlyData[monthKey].cashIn || 0) + debit;
        monthlyData[monthKey].cashOut = (monthlyData[monthKey].cashOut || 0) + credit;
      }

      if (mod === 'INCOME') monthlyData[monthKey].income += debit;
      if (mod === 'EXPENSE' || mod === 'PAYROLL') monthlyData[monthKey].expense += credit;
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

    // Calculate Trends
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${(lastMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;

    const currMonthData = monthlyData[currentMonthKey] || { income: 0, expense: 0, profit: 0 };
    const prevMonthData = monthlyData[lastMonthKey] || { income: 0, expense: 0, profit: 0 };

    const calculateTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    const trends = {
      revenue: calculateTrend(currMonthData.income, prevMonthData.income),
      expenses: calculateTrend(currMonthData.expense, prevMonthData.expense),
      profit: calculateTrend(currMonthData.profit, prevMonthData.profit),
      cash: 0, // Simplified: cash and outstanding don't have easy MoM tracking here
      loanOutstanding: 0
    };

    // Format Chart Arrays (Last 6 Months)
    const chartMonths: string[] = [];
    const chartIncome: number[] = [];
    const chartExpense: number[] = [];
    const chartProfit: number[] = [];
    const chartCashFlow: number[] = [];
    const chartTargets: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const shortMonth = d.toLocaleString('default', { month: 'short' });
      
      chartMonths.push(shortMonth);
      const mData = monthlyData[mKey] || { income: 0, expense: 0, profit: 0, cashIn: 0, cashOut: 0 };
      
      chartIncome.push(mData.income);
      chartExpense.push(mData.expense);
      chartProfit.push(mData.profit);
      chartCashFlow.push((mData.cashIn || 0) - (mData.cashOut || 0));
      chartTargets.push(mData.income * 1.1); // Placeholder target: 10% above actual income
    }

    return NextResponse.json({
      transactions: recentTransactions,
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
        cashFlow: netCashFlow,
        cogs: 0 // Optional placeholder for COGS if it's used somewhere
      },
      trends,
      charts: {
        monthlyData,
        months: chartMonths,
        income: chartIncome,
        expense: chartExpense,
        trendMonths: chartMonths,
        trendValues: chartIncome,
        trendTargets: chartTargets,
        expenseMonths: chartMonths,
        expenseValues: chartExpense,
        cashFlowMonths: chartMonths,
        cashFlowData: chartCashFlow,
        expenseCategories: expenseCategories.map(c => ({ label: c.category, value: Number(c._sum.amount || 0) })),
        revenueCategories: revenueCategories.map(c => ({ label: c.category, value: Number(c._sum.amount || 0) }))
      }
    });
  } catch (error) {
    console.error("Error fetching finance dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch finance dashboard stats" }, { status: 500 });
  }
}
