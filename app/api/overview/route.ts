import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Calculate Reserve Balance
    const reserveTransactions = await prisma.reserveTransaction.findMany();
    const reserveBalance = reserveTransactions.reduce((acc, tx) => {
      if (tx.type === "DEPOSIT") return acc + Number(tx.amount);
      if (tx.type === "WITHDRAWAL") return acc - Number(tx.amount);
      return acc;
    }, 0);

    // 2. Calculate Total Incomes (Paid/Partial)
    const incomes = await prisma.income.aggregate({
      _sum: { received: true },
      where: { paymentStatus: { in: ["PAID", "PARTIAL"] } }
    });
    const totalIncome = Number(incomes._sum.received || 0);

    // 3. Calculate Total Expenses (Approved)
    const expenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { approvalStatus: "APPROVED" }
    });
    const totalExpenses = Number(expenses._sum.amount || 0);

    // 4. Calculate Net Cash Flow
    const netCashFlow = totalIncome - totalExpenses;

    // 5. Outstanding Loans
    const loans = await prisma.memberLoan.aggregate({
      _sum: { remainingAmount: true },
      where: { status: { in: ["ACTIVE", "OVERDUE"] } }
    });
    const outstandingLoans = Number(loans._sum.remainingAmount || 0);

    // 6. Active Advances
    const advances = await prisma.advance.aggregate({
      _sum: { remainingAmount: true },
      where: { status: "ACTIVE" }
    });
    const activeAdvances = Number(advances._sum.remainingAmount || 0);

    // 7. Calculate Monthly Data (Last 6 Months)
    const allIncomes = await prisma.income.findMany({
      where: { paymentStatus: { in: ["PAID", "PARTIAL"] } },
      select: { createdAt: true, received: true }
    });
    
    const allExpenses = await prisma.expense.findMany({
      where: { approvalStatus: "APPROVED" },
      select: { createdAt: true, amount: true }
    });

    const monthlyData = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const mIncome = allIncomes.filter(inc => {
        const dInc = new Date(inc.createdAt);
        return dInc.getMonth() === m && dInc.getFullYear() === y;
      }).reduce((sum, inc) => sum + Number(inc.received), 0);
      
      const mExpense = allExpenses.filter(exp => {
        const dExp = new Date(exp.createdAt);
        return dExp.getMonth() === m && dExp.getFullYear() === y;
      }).reduce((sum, exp) => sum + Number(exp.amount), 0);
      
      monthlyData.push({
        label: `${monthNames[m]}`,
        revenue: mIncome,
        expense: mExpense,
        netCash: mIncome - mExpense
      });
    }

    // 8. Recent Transactions
    const recentIncomes = await prisma.income.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, category: true, received: true, createdAt: true, source: true }
    });
    const recentExpenses = await prisma.expense.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, category: true, amount: true, createdAt: true, paymentMethod: true }
    });

    const recentTransactions = [
      ...recentIncomes.map(i => ({ id: i.id, type: 'INCOME', category: i.category, amount: Number(i.received), date: i.createdAt, subtitle: i.source })),
      ...recentExpenses.map(e => ({ id: e.id, type: 'EXPENSE', category: e.category, amount: Number(e.amount), date: e.createdAt, subtitle: e.paymentMethod }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return NextResponse.json({
      reserveBalance,
      totalIncome,
      totalExpenses,
      netCashFlow,
      outstandingLoans,
      activeAdvances,
      monthlyData,
      recentTransactions
    });
  } catch (error) {
    console.error("Error fetching overview metrics:", error);
    return NextResponse.json({ error: "Failed to fetch overview metrics" }, { status: 500 });
  }
}

