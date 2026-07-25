import React from 'react';
import Link from 'next/link';
import { JournalEntry } from '../components/JournalEntry';

export default function CreateJournalPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '24px' }}>
        <Link href="/dashboard/finance" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Finance</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <Link href="/dashboard/finance/journal" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Journal Entries</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
        <span style={{ color: 'var(--text-main)' }}>Create Journal Entry</span>
      </div>

      <JournalEntry />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
        <button style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Post Journal</button>
      </div>
    </div>
  );
}
