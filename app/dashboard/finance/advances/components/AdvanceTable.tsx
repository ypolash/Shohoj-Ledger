"use client";

import React from 'react';

export function AdvanceTable() {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Active Advances</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Beneficiary</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Type</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Expected Recovery</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Issued Amount</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Unrecovered</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '16px', color: 'var(--text-muted)' }}>2026-07-20</td>
            <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>Tech Solutions Ltd</td>
            <td style={{ padding: '16px', color: 'var(--text-main)' }}>Supplier Advance</td>
            <td style={{ padding: '16px', color: 'var(--text-main)' }}>2026-08-20</td>
            <td style={{ padding: '16px', fontWeight: 600, textAlign: 'right', color: 'var(--text-muted)' }}>500,000</td>
            <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--warning)' }}>500,000</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
