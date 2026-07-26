"use client";

import React from 'react';

export function GeneralLedgerTable() {
  return (
    <div className="glass-card" style={{ borderRadius: '12px', overflowX: 'auto', marginBottom: '24px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Account</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Journal Ref</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Memo / Description</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Debit</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Credit</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Running Balance</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>2026-07-26</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-main)' }}>1000 - Cash</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>JE-9912</td>
            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Customer payment INV-2026-001</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right', color: 'var(--success)' }}>1,500,000</td>
            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
            <td style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>1,500,000 Dr</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>2026-07-26</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-main)' }}>1200 - A/R</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>JE-9912</td>
            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Customer payment INV-2026-001</td>
            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right', color: 'var(--danger)' }}>1,500,000</td>
            <td style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>500,000 Dr</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
