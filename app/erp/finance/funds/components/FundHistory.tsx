"use client";

import React from 'react';

export function FundHistory() {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Recent Fund Transfers</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Reference</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Source Account</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Destination Account</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Amount (BDT)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '16px', color: 'var(--text-muted)' }}>2026-07-26</td>
            <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>TRF-0991</td>
            <td style={{ padding: '16px', color: 'var(--text-main)' }}>City Bank (Main)</td>
            <td style={{ padding: '16px', color: 'var(--text-main)' }}>Petty Cash</td>
            <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>50,000</td>
            <td style={{ padding: '16px', textAlign: 'center' }}><span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, background: 'var(--success-glow)', color: 'var(--success)' }}>Completed</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
