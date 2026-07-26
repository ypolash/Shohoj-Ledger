"use client";

import React from 'react';

export function AccountHistory() {
  const transactions = [
    { date: 'Jul 26, 2026', type: 'Credit', amount: 1250000, balance: 4500000, ref: 'TX-2026-8891', desc: 'Payment from Acme Corp' },
    { date: 'Jul 25, 2026', type: 'Debit', amount: 250000, balance: 3250000, ref: 'TX-2026-8890', desc: 'Office Rent - Gulshan' },
    { date: 'Jul 24, 2026', type: 'Debit', amount: 45000, balance: 3500000, ref: 'TX-2026-8889', desc: 'Server Hosting' },
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', overflowX: 'auto' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600 }}>Transaction History</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)' }}>
            <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Date</th>
            <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Reference</th>
            <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Description</th>
            <th style={{ paddingBottom: '12px', fontWeight: 600, textAlign: 'right' }}>Debit (Out)</th>
            <th style={{ paddingBottom: '12px', fontWeight: 600, textAlign: 'right' }}>Credit (In)</th>
            <th style={{ paddingBottom: '12px', fontWeight: 600, textAlign: 'right' }}>Running Balance</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {transactions.map((tx, i) => (
            <tr key={i} style={{ borderBottom: i !== transactions.length -1 ? '1px solid var(--border-light)' : 'none' }}>
              <td style={{ padding: '16px 0', color: 'var(--text-muted)' }}>{tx.date}</td>
              <td style={{ padding: '16px 0', fontWeight: 600, color: 'var(--primary)' }}>{tx.ref}</td>
              <td style={{ padding: '16px 0', color: 'var(--text-main)' }}>{tx.desc}</td>
              <td style={{ padding: '16px 0', textAlign: 'right', color: 'var(--danger)', fontWeight: 600 }}>
                {tx.type === 'Debit' ? new Intl.NumberFormat('en-US').format(tx.amount) : '-'}
              </td>
              <td style={{ padding: '16px 0', textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>
                {tx.type === 'Credit' ? new Intl.NumberFormat('en-US').format(tx.amount) : '-'}
              </td>
              <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                {new Intl.NumberFormat('en-US').format(tx.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
