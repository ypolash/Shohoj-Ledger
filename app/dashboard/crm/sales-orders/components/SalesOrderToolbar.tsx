"use client";

import React from 'react';
import Link from 'next/link';

interface SalesOrderToolbarProps {
  onRefresh?: () => void;
}

export function SalesOrderToolbar({ onRefresh }: SalesOrderToolbarProps) {
  const btnStyle = {
    padding: '8px 16px',
    background: 'var(--surface-hover)',
    border: '1px solid var(--border-main)',
    color: 'var(--text-main)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderRadius: '8px'
  };

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
      <button onClick={onRefresh} style={btnStyle}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
      </button>

      <button style={btnStyle}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
        Export
      </button>

      <Link href="/dashboard/crm/sales-orders/new">
        <button style={{ ...btnStyle, background: 'var(--primary)', color: 'white', border: 'none' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          New Order
        </button>
      </Link>
    </div>
  );
}
