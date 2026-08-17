import React from 'react';
import Link from 'next/link';
import { IncomeSummary } from '../components/IncomeSummary';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function IncomeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await getSession();
  const companyId = session?.user?.companyId;
  
  if (!companyId) return redirect('/login');

  const income = await prisma.income.findUnique({
    where: { id, companyId }
  });

  if (!income) return notFound();

  const serializedIncome = {
    ...income,
    amount: Number(income.amount),
    received: Number(income.received),
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '24px' }}>
        <Link href="/erp/finance" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Finance</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <Link href="/erp/finance/income" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Income</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <span style={{ color: 'var(--text-main)' }}>INC-{income.id.split('-')[0].toUpperCase()}</span>
      </div>

      <IncomeSummary income={serializedIncome} />
    </div>
  );
}
