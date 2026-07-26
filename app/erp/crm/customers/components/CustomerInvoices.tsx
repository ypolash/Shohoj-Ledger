"use client";

import React from 'react';

export function CustomerInvoices() {
  const invoices = [
    { id: 'INV-2026-001', date: '2026-07-20', dueDate: '2026-08-20', amount: 50000, status: 'Unpaid' },
  ];

  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px', marginTop: '24px' }}>
      <h4 style={{ margin: '0', padding: '24px', fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-main)' }}>Invoices</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Invoice #</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Due Date</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Amount</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Status</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {invoices.map(inv => (
            <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--primary)' }}>{inv.id}</td>
              <td style={{ padding: '16px 24px' }}>{inv.date}</td>
              <td style={{ padding: '16px 24px' }}>{inv.dueDate}</td>
              <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(inv.amount)}
              </td>
              <td style={{ padding: '16px 24px' }}>
                <span style={{
                  padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  background: inv.status === 'Paid' ? 'var(--success-glow)' : 'var(--danger-glow)',
                  color: inv.status === 'Paid' ? 'var(--success)' : 'var(--danger)',
                }}>{inv.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
