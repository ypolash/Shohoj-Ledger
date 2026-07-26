"use client";

import React from 'react';

export function OpportunityProducts() {
  const products = [
    { id: 1, name: 'Enterprise License', quantity: 50, price: 5000, total: 250000 },
    { id: 2, name: 'Premium Support Plan', quantity: 1, price: 100000, total: 100000 },
  ];

  const grandTotal = products.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--border-main)' }}>
        <h4 style={{ margin: '0', fontSize: '16px', fontWeight: 600 }}>Products & Services</h4>
        <button style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
          + Add Product
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Product/Service</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Quantity</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Unit Price</th>
            <th style={{ padding: '12px 24px', fontWeight: 600, textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {products.map(prod => (
            <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '16px 24px', fontWeight: 500 }}>{prod.name}</td>
              <td style={{ padding: '16px 24px' }}>{prod.quantity}</td>
              <td style={{ padding: '16px 24px' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(prod.price)}
              </td>
              <td style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(prod.total)}
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={3} style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right', color: 'var(--text-muted)' }}>Grand Total</td>
            <td style={{ padding: '16px 24px', fontWeight: 'bold', fontSize: '16px', color: 'var(--primary)', textAlign: 'right' }}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
