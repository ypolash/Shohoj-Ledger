"use client";

import React from 'react';

export function ExpenseToolbar({ onRecordExpense }: { onRecordExpense?: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>Expenses & Payables</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>Manage operational expenses and vendor payments</p>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} className="hover-bg-surface-hover">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
          Export
        </button>
        <button onClick={onRecordExpense} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} className="hover-bg-primary-hover shadow-sm">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Record Expense
        </button>
      </div>
    </div>
  );
}
