"use client";

import React from 'react';

export function LoanTable() {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Active Facilities</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Bank / Institution</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Facility Type</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Interest Rate</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Principal Amount</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Outstanding</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>Standard Chartered</td>
            <td style={{ padding: '16px', color: 'var(--text-main)' }}>Term Loan</td>
            <td style={{ padding: '16px', color: 'var(--danger)' }}>8.5% p.a.</td>
            <td style={{ padding: '16px', fontWeight: 600, textAlign: 'right', color: 'var(--text-muted)' }}>10,000,000</td>
            <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--danger)' }}>6,500,000</td>
            <td style={{ padding: '16px', textAlign: 'center' }}><span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, background: 'var(--warning-glow)', color: 'var(--warning)' }}>Active</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
