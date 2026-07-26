"use client";

import React from 'react';
import Link from 'next/link';

export function AccountBreadcrumb({ currentName }: { currentName: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '24px' }}>
      <Link href="/erp/finance" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Finance</Link>
      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
      <Link href="/erp/finance/accounts" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Chart of Accounts</Link>
      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--border-main)' }}>chevron_right</span>
      <span style={{ color: 'var(--text-main)' }}>{currentName}</span>
    </div>
  );
}
