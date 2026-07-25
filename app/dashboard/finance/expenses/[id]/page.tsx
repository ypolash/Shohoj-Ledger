import React from 'react';
import Link from 'next/link';
import { ExpenseSummary } from '../components/ExpenseSummary';

export default function ExpenseDetailPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '24px' }}>
        <Link href="/dashboard/finance" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Finance</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <Link href="/dashboard/finance/expenses" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Expenses</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <span style={{ color: 'var(--text-main)' }}>EXP-2026-081</span>
      </div>

      <ExpenseSummary />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Link href="/dashboard/finance/expenses/1/edit" style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>Edit Expense</Link>
      </div>
    </div>
  );
}
