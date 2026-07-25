import React from 'react';
import Link from 'next/link';
import { ExpenseForm } from '../components/ExpenseForm';

export default function CreateExpensePage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '24px' }}>
        <Link href="/dashboard/finance" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Finance</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <Link href="/dashboard/finance/expenses" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Expenses</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <span style={{ color: 'var(--text-main)' }}>Record Expense</span>
      </div>

      <ExpenseForm />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
        <button style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save Expense</button>
      </div>
    </div>
  );
}
