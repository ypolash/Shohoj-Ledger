"use client";

import React from 'react';

export function RecentTransactions() {
  const transactions = [
    { id: 'TX-2026-8891', date: 'Jul 26, 2026', desc: 'Payment from Acme Corp', type: 'Income', amount: 1250000, status: 'Completed' },
    { id: 'TX-2026-8890', date: 'Jul 25, 2026', desc: 'Office Rent - Gulshan', type: 'Expense', amount: 250000, status: 'Completed' },
    { id: 'TX-2026-8889', date: 'Jul 24, 2026', desc: 'Server Hosting (AWS)', type: 'Expense', amount: 45000, status: 'Pending' },
    { id: 'TX-2026-8888', date: 'Jul 23, 2026', desc: 'Consulting Fees (Initech)', type: 'Income', amount: 450000, status: 'Completed' },
    { id: 'TX-2026-8887', date: 'Jul 22, 2026', desc: 'Employee Salaries', type: 'Expense', amount: 2800000, status: 'Completed' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Recent Transactions</h3>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>View All</button>
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 16px', fontWeight: 600, borderRadius: '8px 0 0 8px' }}>Transaction ID</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Description</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Amount (BDT)</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {transactions.map((tx, i) => (
            <tr key={i} style={{ borderBottom: i !== transactions.length -1 ? '1px solid var(--border-light)' : 'none' }}>
              <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{tx.id}</td>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{tx.date}</td>
              <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: 500 }}>{tx.desc}</td>
              <td style={{ padding: '16px' }}>
                <span style={{ 
                  padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                  background: tx.status === 'Completed' ? 'var(--success-glow)' : 'var(--warning-glow)',
                  color: tx.status === 'Completed' ? 'var(--success)' : 'var(--warning)'
                }}>
                  {tx.status}
                </span>
              </td>
              <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: tx.type === 'Income' ? 'var(--success)' : 'var(--danger)' }}>
                {tx.type === 'Income' ? '+' : '-'}{new Intl.NumberFormat('en-US').format(tx.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
