import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const member = await prisma.member.findUnique({
      where: { id }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Calculate Wallet Balance from Settlements based on Role
    let totalEarned = 0;
    const settlements = await prisma.settlement.findMany({
      where: { status: 'EXECUTED' }
    });

    if (member.role.toLowerCase().includes('ceo')) {
      totalEarned = settlements.reduce((sum, s) => sum + Number(s.ceoShare), 0);
    } else if (member.role.toLowerCase().includes('developer')) {
      totalEarned = settlements.reduce((sum, s) => sum + Number(s.developerShare), 0);
    }

    // Calculate Deductions (Active Advances & Loans)
    const advances = await prisma.advance.findMany({
      where: { memberId: id, status: 'ACTIVE' }
    });
    const totalAdvances = advances.reduce((sum, a) => sum + Number(a.remainingAmount), 0);

    const loans = await prisma.memberLoan.findMany({
      where: { memberId: id, status: 'ACTIVE' }
    });
    const totalLoans = loans.reduce((sum, l) => sum + Number(l.remainingAmount), 0);

    const totalDeductions = totalAdvances + totalLoans;
    const walletBalance = totalEarned;
    const availableForWithdrawal = totalEarned - totalDeductions;

    // Recent Transactions (Settlements + Advances)
    let transactions: any[] = [];
    
    // Add Settlements as Income
    settlements.forEach(s => {
      let amount = 0;
      if (member.role.toLowerCase().includes('ceo')) amount = Number(s.ceoShare);
      else if (member.role.toLowerCase().includes('developer')) amount = Number(s.developerShare);
      
      if (amount > 0) {
        transactions.push({
          id: s.id,
          date: s.createdAt,
          description: `Settlement Share (${s.period})`,
          category: 'Income',
          amount: amount,
          type: 'positive'
        });
      }
    });

    // Add Advances as Deductions/Debits
    advances.forEach(a => {
      transactions.push({
        id: a.id,
        date: a.createdAt,
        description: a.reason || 'Salary Advance',
        category: 'Advance',
        amount: Number(a.amount),
        type: 'negative'
      });
    });

    // Add Loans
    loans.forEach(l => {
      transactions.push({
        id: l.id,
        date: l.createdAt,
        description: 'Member Loan',
        category: 'Loan',
        amount: Number(l.amount),
        type: 'negative'
      });
    });

    // Sort transactions by date descending, take top 5
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentTransactions = transactions.slice(0, 5);

    return NextResponse.json({
      ...member,
      financials: {
        walletBalance,
        totalAdvances,
        totalLoans,
        availableForWithdrawal,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Failed to fetch member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
