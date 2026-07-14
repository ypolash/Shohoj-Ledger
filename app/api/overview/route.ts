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

    return NextResponse.json({
      reserveBalance,
      totalIncome,
      totalExpenses,
      netCashFlow,
      outstandingLoans,
      activeAdvances
    });
  } catch (error) {
    console.error("Error fetching overview metrics:", error);
    return NextResponse.json({ error: "Failed to fetch overview metrics" }, { status: 500 });
  }
}
