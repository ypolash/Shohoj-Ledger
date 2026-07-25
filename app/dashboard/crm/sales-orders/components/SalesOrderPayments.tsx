"use client";

import React from 'react';

export function SalesOrderPayments() {
  const payments = [
    { id: 'PAY-001', amount: 250000, date: '2026-07-24', method: 'Bank Transfer' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Received Payments</h4>
        <button style={{ padding: '6px 12px', background: 'var(--success-glow)', color: 'var(--success)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--success)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>payments</span>
          Record Payment
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px', fontWeight: 600 }}>Payment #</th>
            <th style={{ padding: '12px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '12px', fontWeight: 600 }}>Method</th>
            <th style={{ padding: '12px', fontWeight: 600 }}>Amount</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {payments.map((pay) => (
            <tr key={pay.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px', fontWeight: 600 }}>{pay.id}</td>
              <td style={{ padding: '12px' }}>{new Date(pay.date).toLocaleDateString()}</td>
              <td style={{ padding: '12px' }}>{pay.method}</td>
              <td style={{ padding: '12px', fontWeight: 600, color: 'var(--success)' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(pay.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
