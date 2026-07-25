"use client";

import React from 'react';

export function CustomerPayments() {
  const payments = [
    { id: 'PAY-001', date: '2026-07-25', method: 'Bank Transfer', amount: 25000, status: 'Completed' },
  ];

  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px', marginTop: '24px' }}>
      <h4 style={{ margin: '0', padding: '24px', fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-main)' }}>Payments</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Receipt #</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Method</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Amount</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Status</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {payments.map(pay => (
            <tr key={pay.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--primary)' }}>{pay.id}</td>
              <td style={{ padding: '16px 24px' }}>{pay.date}</td>
              <td style={{ padding: '16px 24px' }}>{pay.method}</td>
              <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--success)' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(pay.amount)}
              </td>
              <td style={{ padding: '16px 24px' }}>
                <span style={{
                  padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  background: pay.status === 'Completed' ? 'var(--success-glow)' : 'var(--warning-glow)',
                  color: pay.status === 'Completed' ? 'var(--success)' : 'var(--warning)',
                }}>{pay.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
