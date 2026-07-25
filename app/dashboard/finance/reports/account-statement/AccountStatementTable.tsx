"use client";

import React from 'react';

export function AccountStatementTable() {
  return (
    <div className="glass-card" style={{ borderRadius: '12px', overflowX: 'auto', marginBottom: '24px' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>1000 - Cash on Hand</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Statement Period: July 1 - July 31, 2026</p>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Description</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Debit (In)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Credit (Out)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Balance</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>2026-07-01</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-main)' }}>Opening Balance</td>
            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>-</td>
            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>-</td>
            <td style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>500,000</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>2026-07-26</td>
            <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>Customer payment INV-2026-001</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right', color: 'var(--success)' }}>1,500,000</td>
            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
            <td style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>2,000,000</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
