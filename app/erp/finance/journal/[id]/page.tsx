import React from 'react';
import Link from 'next/link';
import { JournalPreview } from '../components/JournalPreview';

export default function JournalDetailPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '24px' }}>
        <Link href="/erp/finance" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Finance</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <Link href="/erp/finance/journal" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Journal Entries</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <span style={{ color: 'var(--text-main)' }}>JV-2026-001</span>
      </div>

      <JournalPreview />
    </div>
  );
}
