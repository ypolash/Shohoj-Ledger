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
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth(); // 0-11
    const currentMonthKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;

    // Query parameters
    const period = searchParams.get('period') || 'this_month'; // 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all' | 'custom'
    const queryYear = parseInt(searchParams.get('year') || String(currentYear), 10);
    const queryMonth = searchParams.get('month'); // e.g. "2026-10" or "10"
    const accountFilter = (searchParams.get('account') || 'ALL').toUpperCase();

    // 1. Fetch all ledger entries for this company
    const ledgers = await prisma.ledgerEntry.findMany({
      where: whereClause,
      select: { 
        id: true, 
        debit: true, 
        credit: true, 
        module: true, 
        accountType: true, 
        date: true, 
        description: true, 
        referenceId: true, 
        status: true 
      },
      orderBy: { date: 'desc' }
    });

    // 2. Fetch all incomes & expenses for fallback/reconciliation
    const [allIncomes, allExpenses, reserveTxs, activeLoansData, pendingExpensesData, purchaseOrders, supplierLedgers] = await Promise.all([
      prisma.income.findMany({
        where: whereClause,
        select: { id: true, amount: true, received: true, createdAt: true, category: true, paymentStatus: true }
      }),
      prisma.expense.findMany({
        where: whereClause,
        select: { id: true, amount: true, createdAt: true, category: true, approvalStatus: true }
      }),
      prisma.reserveTransaction.findMany({
        where: whereClause,
        select: { id: true, type: true, amount: true, createdAt: true }
      }),
      prisma.memberLoan.aggregate({
        where: { ...whereClause, status: { in: ["ACTIVE", "OVERDUE"] } },
        _sum: { remainingAmount: true }
      }),
      prisma.expense.aggregate({
        where: { ...whereClause, approvalStatus: { in: ["PENDING", "UNPAID"] } },
        _sum: { amount: true }
      }),
      prisma.purchaseOrder.findMany({
        where: whereClause,
        select: { id: true, totalAmount: true }
      }),
      prisma.ledgerEntry.findMany({
        where: {
          ...whereClause,
          module: "INVENTORY",
          voucherType: { in: ["SUPPLIER_PAYMENT", "PURCHASE_PAYMENT"] }
        },
        select: { referenceId: true, debit: true }
      })
    ]);

    const poPaymentsMap: Record<string, number> = {};
    supplierLedgers.forEach((l: any) => {
      if (l.referenceId) {
        poPaymentsMap[l.referenceId] = (poPaymentsMap[l.referenceId] || 0) + Number(l.debit || 0);
      }
    });

    let pendingPurchasesDue = 0;
    purchaseOrders.forEach((po: any) => {
      const tot = Number(po.totalAmount || 0);
      const paid = poPaymentsMap[po.id] || 0;
      pendingPurchasesDue += Math.max(0, tot - paid);
    });

    // Active Loans & Bills Due
    const activeLoans = Number(activeLoansData._sum.remainingAmount || 0);
    const billsDue = Number(pendingExpensesData._sum.amount || 0) + pendingPurchasesDue;

    // Reserve Balance
    let reserveBalance = 0;
    reserveTxs.forEach((tx: any) => {
      const amt = Number(tx.amount || 0);
      if (tx.type === "DEPOSIT" || tx.type === "CREDIT") reserveBalance += amt;
      else if (tx.type === "WITHDRAWAL" || tx.type === "DEBIT") reserveBalance -= amt;
    });

    // Determine distinct available years from ledgers, incomes, and expenses
    const yearsSet = new Set<number>([currentYear]);
    ledgers.forEach((l: any) => yearsSet.add(new Date(l.date).getFullYear()));
    allIncomes.forEach((i: any) => yearsSet.add(new Date(i.createdAt).getFullYear()));
    allExpenses.forEach((e: any) => yearsSet.add(new Date(e.createdAt).getFullYear()));
    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    // Full 12-Month Array for the selected year
    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthNamesFull = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const monthlyMap: Record<string, { income: number; expense: number; profit: number; cashIn: number; cashOut: number }> = {};

    // Lifetime liquidity & balances
    let lifetimeCash = 0;
    let lifetimeBank = 0;
    let lifetimeIncome = 0;
    let lifetimeExpense = 0;
    let lifetimePayroll = 0;

    // Process ledgers
    ledgers.forEach((l: any) => {
      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);
      const net = debit - credit;
      const netCredit = credit - debit;

      const accType = (l.accountType || '').toUpperCase();
      const mod = (l.module || '').toUpperCase();

      if (accType.includes('CASH')) lifetimeCash += net;
      if (accType.includes('BANK')) lifetimeBank += net;
      if (accType.includes('RESERVE') || mod === 'RESERVE') reserveBalance += netCredit;

      if (mod === 'INCOME') lifetimeIncome += debit;
      if (mod === 'EXPENSE') lifetimeExpense += credit;
      if (mod === 'PAYROLL') lifetimePayroll += credit;

      // Group by month
      const lDate = new Date(l.date);
      const mKey = `${lDate.getFullYear()}-${String(lDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[mKey]) {
        monthlyMap[mKey] = { income: 0, expense: 0, profit: 0, cashIn: 0, cashOut: 0 };
      }

      if (accType.includes('CASH') || accType.includes('BANK')) {
        monthlyMap[mKey].cashIn += debit;
        monthlyMap[mKey].cashOut += credit;
      }
      if (mod === 'INCOME') monthlyMap[mKey].income += debit;
      if (mod === 'EXPENSE' || mod === 'PAYROLL') monthlyMap[mKey].expense += credit;
    });

    // If ledgers have no income/expense records, reconcile with Income and Expense tables
    if (lifetimeIncome === 0 && allIncomes.length > 0) {
      allIncomes.forEach((inc: any) => {
        const amt = Number(inc.received || inc.amount || 0);
        lifetimeIncome += amt;
        const iDate = new Date(inc.createdAt);
        const mKey = `${iDate.getFullYear()}-${String(iDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[mKey]) monthlyMap[mKey] = { income: 0, expense: 0, profit: 0, cashIn: 0, cashOut: 0 };
        monthlyMap[mKey].income += amt;
        monthlyMap[mKey].cashIn += amt;
      });
    }

    if (lifetimeExpense === 0 && allExpenses.length > 0) {
      allExpenses.forEach((exp: any) => {
        const amt = Number(exp.amount || 0);
        lifetimeExpense += amt;
        const eDate = new Date(exp.createdAt);
        const mKey = `${eDate.getFullYear()}-${String(eDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[mKey]) monthlyMap[mKey] = { income: 0, expense: 0, profit: 0, cashIn: 0, cashOut: 0 };
        monthlyMap[mKey].expense += amt;
        monthlyMap[mKey].cashOut += amt;
      });
    }

    // Compute profit for all mapped months
    Object.keys(monthlyMap).forEach(k => {
      monthlyMap[k].profit = Math.round((monthlyMap[k].income - monthlyMap[k].expense) * 100) / 100;
    });

    // 3. Resolve Date Boundaries for the requested filter
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let prevStartDate: Date | null = null;
    let prevEndDate: Date | null = null;
    let periodLabel = "All Time";

    if (queryMonth) {
      // Specific month selected (e.g. "2026-10" or "10")
      let targetMonthIdx = 0;
      let targetYearVal = queryYear;
      if (queryMonth.includes('-')) {
        const parts = queryMonth.split('-');
        targetYearVal = parseInt(parts[0], 10);
        targetMonthIdx = parseInt(parts[1], 10) - 1;
      } else {
        targetMonthIdx = parseInt(queryMonth, 10) - 1;
      }
      startDate = new Date(targetYearVal, targetMonthIdx, 1, 0, 0, 0);
      endDate = new Date(targetYearVal, targetMonthIdx + 1, 0, 23, 59, 59, 999);
      prevStartDate = new Date(targetYearVal, targetMonthIdx - 1, 1, 0, 0, 0);
      prevEndDate = new Date(targetYearVal, targetMonthIdx, 0, 23, 59, 59, 999);
      periodLabel = `${monthNamesFull[targetMonthIdx]} ${targetYearVal}`;
    } else if (period === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      periodLabel = `This Month (${monthNamesShort[now.getMonth()]} ${now.getFullYear()})`;
    } else if (period === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
      prevEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      const lastMonthIdx = (now.getMonth() - 1 + 12) % 12;
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      periodLabel = `Last Month (${monthNamesShort[lastMonthIdx]} ${lastMonthYear})`;
    } else if (period === 'this_quarter') {
      const q = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), q * 3, 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), (q + 1) * 3, 0, 23, 59, 59, 999);
      prevStartDate = new Date(now.getFullYear(), (q - 1) * 3, 1, 0, 0, 0);
      prevEndDate = new Date(now.getFullYear(), q * 3, 0, 23, 59, 59, 999);
      periodLabel = `This Quarter (Q${q + 1} ${now.getFullYear()})`;
    } else if (period === 'this_year') {
      startDate = new Date(queryYear, 0, 1, 0, 0, 0);
      endDate = new Date(queryYear, 11, 31, 23, 59, 59, 999);
      prevStartDate = new Date(queryYear - 1, 0, 1, 0, 0, 0);
      prevEndDate = new Date(queryYear - 1, 11, 31, 23, 59, 59, 999);
      periodLabel = `Year ${queryYear}`;
    } else {
      periodLabel = "All Time";
    }

    // 4. Calculate Period KPIs
    let periodRevenue = 0;
    let periodExpenses = 0;
    let periodPayroll = 0;
    let periodCashIn = 0;
    let periodCashOut = 0;

    let prevRevenue = 0;
    let prevExpenses = 0;
    let prevProfit = 0;

    ledgers.forEach((l: any) => {
      const lDate = new Date(l.date);
      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);
      const mod = (l.module || '').toUpperCase();
      const accType = (l.accountType || '').toUpperCase();

      // Account filter
      if (accountFilter !== 'ALL') {
        if (!accType.includes(accountFilter)) return;
      }

      // Check current period match
      const inCurrentPeriod = !startDate || (lDate >= startDate && lDate <= endDate!);
      if (inCurrentPeriod) {
        if (mod === 'INCOME') periodRevenue += debit;
        if (mod === 'EXPENSE') periodExpenses += credit;
        if (mod === 'PAYROLL') periodPayroll += credit;
        if (accType.includes('CASH') || accType.includes('BANK')) {
          periodCashIn += debit;
          periodCashOut += credit;
        }
      }

      // Check previous period match for trends
      const inPrevPeriod = prevStartDate && prevEndDate && lDate >= prevStartDate && lDate <= prevEndDate;
      if (inPrevPeriod) {
        if (mod === 'INCOME') prevRevenue += debit;
        if (mod === 'EXPENSE' || mod === 'PAYROLL') prevExpenses += credit;
      }
    });

    // Fallback if ledger was empty for the period but incomes/expenses exist
    if (periodRevenue === 0 && allIncomes.length > 0) {
      allIncomes.forEach((inc: any) => {
        const iDate = new Date(inc.createdAt);
        if (!startDate || (iDate >= startDate && iDate <= endDate!)) {
          periodRevenue += Number(inc.received || inc.amount || 0);
        }
        if (prevStartDate && prevEndDate && iDate >= prevStartDate && iDate <= prevEndDate) {
          prevRevenue += Number(inc.received || inc.amount || 0);
        }
      });
    }

    if (periodExpenses === 0 && allExpenses.length > 0) {
      allExpenses.forEach((exp: any) => {
        const eDate = new Date(exp.createdAt);
        if (!startDate || (eDate >= startDate && eDate <= endDate!)) {
          periodExpenses += Number(exp.amount || 0);
        }
        if (prevStartDate && prevEndDate && eDate >= prevStartDate && eDate <= prevEndDate) {
          prevExpenses += Number(exp.amount || 0);
        }
      });
    }

    // Clean rounding
    periodRevenue = Math.round(periodRevenue * 100) / 100;
    periodExpenses = Math.round(periodExpenses * 100) / 100;
    const periodProfit = Math.round((periodRevenue - periodExpenses - periodPayroll) * 100) / 100;
    const periodCashFlow = Math.round((periodCashIn - periodCashOut) * 100) / 100;

    prevProfit = Math.round((prevRevenue - prevExpenses) * 100) / 100;

    // 5. Calculate Trends (% comparison against previous period)
    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : (curr < 0 ? -100 : 0);
      return Math.round(((curr - prev) / Math.abs(prev)) * 1000) / 10;
    };

    const trends = {
      revenue: calcTrend(periodRevenue, prevRevenue),
      expenses: calcTrend(periodExpenses, prevExpenses),
      profit: calcTrend(periodProfit, prevProfit),
      cash: 0
    };

    // 6. Build the 12-Month Series for the Selected Year (Jan - Dec)
    const chartMonths: string[] = [];
    const chartIncome: number[] = [];
    const chartExpense: number[] = [];
    const chartProfit: number[] = [];
    const chartCashFlow: number[] = [];
    const monthlySeries: any[] = [];

    for (let m = 0; m < 12; m++) {
      const mShort = monthNamesShort[m];
      const mFull = monthNamesFull[m];
      const mKey = `${queryYear}-${String(m + 1).padStart(2, '0')}`;
      const dataForMonth = monthlyMap[mKey] || { income: 0, expense: 0, profit: 0, cashIn: 0, cashOut: 0 };

      chartMonths.push(mShort);
      chartIncome.push(dataForMonth.income);
      chartExpense.push(dataForMonth.expense);
      chartProfit.push(dataForMonth.profit);
      chartCashFlow.push(dataForMonth.cashIn - dataForMonth.cashOut);

      const isCurrentMonth = queryYear === currentYear && m === currentMonthIndex;
      const isSelectedMonth = queryMonth ? (mKey === queryMonth || String(m + 1) === queryMonth) : isCurrentMonth;

      const netMargin = dataForMonth.income > 0 
        ? Math.round(((dataForMonth.income - dataForMonth.expense) / dataForMonth.income) * 1000) / 10
        : 0;

      monthlySeries.push({
        month: mShort,
        monthFull: mFull,
        monthKey: mKey,
        monthIndex: m,
        year: queryYear,
        revenue: dataForMonth.income,
        expense: dataForMonth.expense,
        profit: dataForMonth.profit,
        cashIn: dataForMonth.cashIn,
        cashOut: dataForMonth.cashOut,
        netMargin,
        isCurrentMonth,
        isSelected: isSelectedMonth
      });
    }

    // 7. Recent Transactions (Formatted cleanly)
    const recentTransactions = ledgers.slice(0, 7).map((l: any) => ({
      id: l.referenceId || l.id,
      date: l.date,
      description: l.description || 'Ledger Entry',
      status: l.status || 'POSTED',
      credit: Number(l.credit || 0),
      debit: Number(l.debit || 0),
      amount: Number(l.debit || 0) > 0 ? Number(l.debit || 0) : Number(l.credit || 0),
      type: Number(l.debit || 0) > 0 ? 'INCOME' : 'EXPENSE'
    }));

    // 8. Categories Breakdown
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
      success: true,
      periodInfo: {
        period,
        year: queryYear,
        month: queryMonth,
        label: periodLabel,
        availableYears
      },
      kpis: {
        revenue: periodRevenue,
        expenses: periodExpenses,
        profit: periodProfit,
        cash: lifetimeCash,
        bank: lifetimeBank,
        reserve: reserveBalance,
        activeLoans,
        billsDue,
        loanOutstanding: activeLoans,
        pendingBills: billsDue,
        payroll: periodPayroll,
        cashFlow: periodCashFlow
      },
      lifetimeKpis: {
        revenue: Math.round(lifetimeIncome * 100) / 100,
        expenses: Math.round(lifetimeExpense * 100) / 100,
        profit: Math.round((lifetimeIncome - lifetimeExpense - lifetimePayroll) * 100) / 100,
        cash: lifetimeCash,
        bank: lifetimeBank,
        reserve: reserveBalance,
        activeLoans,
        billsDue
      },
      trends,
      charts: {
        monthlyData: monthlyMap,
        monthlySeries,
        months: chartMonths,
        income: chartIncome,
        expense: chartExpense,
        profit: chartProfit,
        cashFlow: chartCashFlow,
        trendMonths: chartMonths,
        trendValues: chartIncome,
        trendTargets: chartIncome.map((v: number) => Math.round(v * 1.15)),
        expenseCategories: expenseCategories.map((c: any) => ({ label: c.category || 'General', value: Number(c._sum.amount || 0) })),
        revenueCategories: revenueCategories.map((c: any) => ({ label: c.category || 'General', value: Number(c._sum.amount || 0) }))
      },
      transactions: recentTransactions
    });
  } catch (error: any) {
    console.error("Error fetching finance dashboard stats:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch finance dashboard stats" }, { status: 500 });
  }
}
