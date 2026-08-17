"use client";

import React from 'react';

export function FundHistory({ funds = [] }: { funds?: any[] }) {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', overflowX: 'auto' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Recent Fund Transfers</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Reference</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Source</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Description</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Amount (BDT)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {funds.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No fund transfers found.</td>
            </tr>
          ) : (
            funds.map((f, i) => (
              <tr key={f.id} style={{ borderBottom: i !== funds.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{f.id.substring(0, 8).toUpperCase()}</td>
                <td style={{ padding: '16px', color: 'var(--text-main)' }}>{f.source || 'Internal'}</td>
                <td style={{ padding: '16px', color: 'var(--text-main)' }}>{f.description || '-'}</td>
                <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>
                  {new Intl.NumberFormat('en-US').format(f.amount || 0)}
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}><span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, background: 'var(--success-glow)', color: 'var(--success)' }}>Completed</span></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
