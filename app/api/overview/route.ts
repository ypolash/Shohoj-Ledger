import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: "Unauthorized or missing company context" }, { status: 401 });
    }
    
    const companyId = session.user.companyId;

    // 1. Optimize sequential awaits using Promise.all
    const [
      reserveTransactions,
      incomes,
      expenses,
      loans,
      advances,
      allIncomes,
      allExpenses,
      recentIncomes,
      recentExpenses
    ] = await Promise.all([
      prisma.reserveTransaction.findMany({ where: { companyId } }),
      prisma.income.aggregate({
        _sum: { received: true },
        where: { companyId, paymentStatus: { in: ["PAID", "PARTIAL"] } }
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { companyId, approvalStatus: "APPROVED" }
      }),
      prisma.memberLoan.aggregate({
        _sum: { remainingAmount: true },
        where: { companyId, status: { in: ["ACTIVE", "OVERDUE"] } }
      }),
      prisma.advance.aggregate({
        _sum: { remainingAmount: true },
        where: { companyId, status: "ACTIVE" }
      }),
      prisma.income.findMany({
        where: { companyId, paymentStatus: { in: ["PAID", "PARTIAL"] } },
        select: { createdAt: true, received: true }
      }),
      prisma.expense.findMany({
        where: { companyId, approvalStatus: "APPROVED" },
        select: { createdAt: true, amount: true }
      }),
      prisma.income.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, category: true, received: true, createdAt: true, source: true }
      }),
      prisma.expense.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, category: true, amount: true, createdAt: true, paymentMethod: true }
      })
    ]);

    const reserveBalance = reserveTransactions.reduce((acc, tx) => {
      if (tx.type === "DEPOSIT") return acc + Number(tx.amount);
      if (tx.type === "WITHDRAWAL") return acc - Number(tx.amount);
      return acc;
    }, 0);

    const totalIncome = Number(incomes._sum.received || 0);
    const totalExpenses = Number(expenses._sum.amount || 0);
    const netCashFlow = totalIncome - totalExpenses;
    const outstandingLoans = Number(loans._sum.remainingAmount || 0);
    const activeAdvances = Number(advances._sum.remainingAmount || 0);

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

