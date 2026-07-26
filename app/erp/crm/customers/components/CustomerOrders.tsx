"use client";

import React from 'react';

export function CustomerOrders() {
  const orders = [
    { id: 'ORD-001', date: '2026-07-20', amount: 50000, status: 'Fulfilled' },
    { id: 'ORD-002', date: '2026-07-25', amount: 25000, status: 'Pending' },
  ];

  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px', marginTop: '24px' }}>
      <h4 style={{ margin: '0', padding: '24px', fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-main)' }}>Sales Orders</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Order ID</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Amount</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Status</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {orders.map(order => (
            <tr key={order.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--primary)' }}>{order.id}</td>
              <td style={{ padding: '16px 24px' }}>{order.date}</td>
              <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(order.amount)}
              </td>
              <td style={{ padding: '16px 24px' }}>
                <span style={{
                  padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  background: order.status === 'Fulfilled' ? 'var(--success-glow)' : 'var(--warning-glow)',
                  color: order.status === 'Fulfilled' ? 'var(--success)' : 'var(--warning)',
                }}>{order.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
