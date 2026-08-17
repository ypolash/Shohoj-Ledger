import React from 'react';
import Link from 'next/link';
import { ExpenseSummary } from '../components/ExpenseSummary';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await getSession();
  const companyId = session?.user?.companyId;
  
  if (!companyId) return redirect('/login');

  const expense = await prisma.expense.findUnique({
    where: { id, companyId }
  });

  if (!expense) return notFound();

  const serializedExpense = {
    ...expense,
    amount: Number(expense.amount),
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '24px' }}>
        <Link href="/erp/finance" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Finance</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <Link href="/erp/finance/expenses" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Expenses</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <span style={{ color: 'var(--text-main)' }}>EXP-{expense.id.split('-')[0].toUpperCase()}</span>
      </div>

      <ExpenseSummary expense={serializedExpense} />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Link href={`/erp/finance/expenses/${expense.id}/edit`} style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>Edit Expense</Link>
      </div>
    </div>
  );
}
