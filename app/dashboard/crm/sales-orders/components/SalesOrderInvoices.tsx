"use client";

import React from 'react';
import Link from 'next/link';

export function SalesOrderInvoices() {
  const invoices = [
    { id: 'INV-2026-001', amount: 250000, date: '2026-07-24', status: 'Paid' },
    { id: 'INV-2026-002', amount: 210000, date: '2026-07-25', status: 'Unpaid' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Linked Invoices</h4>
        <button style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: 'none' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Create Invoice
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px', fontWeight: 600 }}>Invoice #</th>
            <th style={{ padding: '12px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '12px', fontWeight: 600 }}>Amount</th>
            <th style={{ padding: '12px', fontWeight: 600 }}>Status</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {invoices.map((inv) => (
            <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px' }}>
                <Link href="#" style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>{inv.id}</Link>
              </td>
              <td style={{ padding: '12px' }}>{new Date(inv.date).toLocaleDateString()}</td>
              <td style={{ padding: '12px', fontWeight: 600 }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(inv.amount)}
              </td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  background: inv.status === 'Paid' ? 'var(--success-glow)' : 'var(--warning-glow)',
                  color: inv.status === 'Paid' ? 'var(--success)' : 'var(--warning)'
                }}>
                  {inv.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
