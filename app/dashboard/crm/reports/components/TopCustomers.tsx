"use client";

import React from 'react';

export function TopCustomers() {
  const customers = [
    { name: 'Acme Corporation', industry: 'Technology', value: 24500000, status: 'Active' },
    { name: 'Globex Inc.', industry: 'Manufacturing', value: 18200000, status: 'Active' },
    { name: 'Soylent Corp', industry: 'Food & Beverage', value: 12500000, status: 'At Risk' },
    { name: 'Initech', industry: 'Software', value: 9800000, status: 'Active' },
    { name: 'Umbrella Corp', industry: 'Research', value: 8400000, status: 'Inactive' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Top Customers (LTV)</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)' }}>
            <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Customer</th>
            <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Industry</th>
            <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Status</th>
            <th style={{ paddingBottom: '12px', fontWeight: 600, textAlign: 'right' }}>Lifetime Value</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {customers.map((c, i) => (
            <tr key={i} style={{ borderBottom: i !== customers.length -1 ? '1px solid var(--border-light)' : 'none' }}>
              <td style={{ padding: '12px 0', fontWeight: 600, color: 'var(--primary)' }}>{c.name}</td>
              <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>{c.industry}</td>
              <td style={{ padding: '12px 0' }}>
                <span style={{ 
                  padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                  background: c.status === 'Active' ? 'var(--success-glow)' : c.status === 'At Risk' ? 'var(--warning-glow)' : 'var(--danger-glow)',
                  color: c.status === 'Active' ? 'var(--success)' : c.status === 'At Risk' ? 'var(--warning)' : 'var(--danger)'
                }}>
                  {c.status}
                </span>
              </td>
              <td style={{ padding: '12px 0', fontWeight: 600, textAlign: 'right', color: 'var(--text-main)' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', notation: 'compact' }).format(c.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
