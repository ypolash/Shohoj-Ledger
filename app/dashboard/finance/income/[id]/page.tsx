import React from 'react';
import Link from 'next/link';
import { IncomeSummary } from '../components/IncomeSummary';

export default function IncomeDetailPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '24px' }}>
        <Link href="/dashboard/finance" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Finance</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <Link href="/dashboard/finance/income" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Income</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <span style={{ color: 'var(--text-main)' }}>INV-2026-001</span>
      </div>

      <IncomeSummary />
    </div>
  );
}
