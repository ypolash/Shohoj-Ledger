"use client";

import React from 'react';

export function SettlementTable() {
  const settlements = [
    { id: '1', date: '2026-07-26', batchId: 'STL-8819', gateway: 'Stripe', account: 'City Bank (Main)', amount: 450000, fee: 13500, net: 436500, status: 'Completed' },
    { id: '2', date: '2026-07-25', batchId: 'STL-8818', gateway: 'PayPal', account: 'Standard Chartered', amount: 125000, fee: 3750, net: 121250, status: 'Pending' },
    { id: '3', date: '2026-07-24', batchId: 'STL-8817', gateway: 'bKash Merchant', account: 'City Bank (Main)', amount: 850000, fee: 12750, net: 837250, status: 'Completed' },
  ];

  return (
    <div className="glass-card" style={{ borderRadius: '12px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Batch ID</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Gateway / Source</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Deposit Account</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Gross (BDT)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Fees (BDT)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Net (BDT)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {settlements.map((stl, i) => (
            <tr key={stl.id} style={{ borderBottom: i !== settlements.length -1 ? '1px solid var(--border-light)' : 'none' }}>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{stl.date}</td>
              <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{stl.batchId}</td>
              <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{stl.gateway}</td>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{stl.account}</td>
              <td style={{ padding: '16px', fontWeight: 600, textAlign: 'right', color: 'var(--text-muted)' }}>
                {new Intl.NumberFormat('en-US').format(stl.amount)}
              </td>
              <td style={{ padding: '16px', fontWeight: 600, textAlign: 'right', color: 'var(--danger)' }}>
                {new Intl.NumberFormat('en-US').format(stl.fee)}
              </td>
              <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--success)' }}>
                {new Intl.NumberFormat('en-US').format(stl.net)}
              </td>
              <td style={{ padding: '16px', textAlign: 'center' }}>
                <span style={{ 
                  padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                  background: stl.status === 'Completed' ? 'var(--success-glow)' : 'var(--warning-glow)',
                  color: stl.status === 'Completed' ? 'var(--success)' : 'var(--warning)'
                }}>
                  {stl.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
