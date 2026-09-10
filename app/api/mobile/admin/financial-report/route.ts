import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAdmin, CORS_HEADERS } from "@/lib/auth/mobileAdminGuard";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const guard = await verifyMobileAdmin();
  if (!guard.authorized) return guard.response;

  const { companyId } = guard;

  try {
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "all"; // 'month', 'quarter', 'year', 'all'

    const now = new Date();
    let startDate: Date | null = null;

    if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "quarter") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = startDate;
      dateFilter.lte = now;
    }

    const hasDateFilter = startDate !== null;

    // 1. Profit & Loss: Incomes and Expenses
    const [incomeTotal, expenseTotal, incomeByCategory, expenseByCategory] = await Promise.all([
      prisma.income.aggregate({
        where: {
          companyId,
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          companyId,
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { amount: true },
      }),
      prisma.income.groupBy({
        by: ["category"],
        where: {
          companyId,
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
      prisma.expense.groupBy({
        by: ["category"],
        where: {
          companyId,
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
    ]);

    const totalIncome = Number(incomeTotal._sum.amount || 0);
    const totalExpense = Number(expenseTotal._sum.amount || 0);
    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : "0.0";

    // 2. Balance Sheet: Assets, Liabilities, Equity from Ledger Entries
    const ledgerGroups = await prisma.ledgerEntry.groupBy({
      by: ["accountType"],
      where: {
        companyId,
        ...(hasDateFilter ? { date: dateFilter } : {}),
      },
      _sum: { debit: true, credit: true },
    });

    let assets = 0;
    let liabilities = 0;
    let equity = 0;

    ledgerGroups.forEach((g) => {
      const net = Number(g._sum.debit || 0) - Number(g._sum.credit || 0);
      const acc = (g.accountType || "").toUpperCase();
      if (acc === "ASSET" || acc === "CASH" || acc === "BANK") assets += net;
      else if (acc === "LIABILITY" || acc === "LOAN") liabilities -= net;
      else if (acc === "EQUITY" || acc === "CAPITAL" || acc === "RESERVE") equity -= net;
    });

    // Fallback if ledger entries not initialized
    if (assets === 0 && liabilities === 0 && equity === 0) {
      assets = totalIncome > 0 ? totalIncome : 0;
      liabilities = totalExpense > 0 ? totalExpense : 0;
      equity = netProfit;
    }

    // 3. Cash Flow
    const cashLedger = await prisma.ledgerEntry.findMany({
      where: {
        companyId,
        accountType: { in: ["CASH", "BANK"] },
        ...(hasDateFilter ? { date: dateFilter } : {}),
      },
      select: { debit: true, credit: true },
    });

    let cashIn = 0;
    let cashOut = 0;
    cashLedger.forEach((entry) => {
      cashIn += Number(entry.debit || 0);
      cashOut += Number(entry.credit || 0);
    });

    if (cashIn === 0 && cashOut === 0) {
      cashIn = totalIncome;
      cashOut = totalExpense;
    }

    return NextResponse.json(
      {
        success: true,
        period,
        profitAndLoss: {
          totalIncome,
          totalExpense,
          netProfit,
          profitMarginPercent: parseFloat(profitMargin),
          isProfitable: netProfit >= 0,
          topIncomeCategories: incomeByCategory.map((c) => ({
            category: c.category || "General",
            amount: Number(c._sum.amount || 0),
          })),
          topExpenseCategories: expenseByCategory.map((c) => ({
            category: c.category || "General",
            amount: Number(c._sum.amount || 0),
          })),
        },
        balanceSheet: {
          totalAssets: Math.abs(assets),
          totalLiabilities: Math.abs(liabilities),
          netEquity: equity,
        },
        cashFlow: {
          cashIn,
          cashOut,
          netCashFlow: cashIn - cashOut,
        },
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[Mobile Admin Financial Report] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load financial report." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
