"use client";

import React from 'react';

export function RecentTransactions({ transactions = [] }: { transactions?: any[] }) {
  // If no transactions are provided, we don't render demo data anymore.
  
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
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions found.</td>
            </tr>
          ) : (
            transactions.map((tx, i) => (
              <tr key={tx.id || i} style={{ borderBottom: i !== transactions.length -1 ? '1px solid var(--border-light)' : 'none' }}>
                <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{tx.id || tx.reference}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{tx.date ? new Date(tx.date).toLocaleDateString() : (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A')}</td>
                <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: 500 }}>{tx.desc || tx.description}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                    background: (tx.status === 'Completed' || tx.status === 'POSTED') ? 'var(--success-glow)' : 'var(--warning-glow)',
                    color: (tx.status === 'Completed' || tx.status === 'POSTED') ? 'var(--success)' : 'var(--warning)'
                  }}>
                    {tx.status}
                  </span>
                </td>
                <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: (tx.type === 'Income' || tx.type === 'INCOME' || tx.credit) ? 'var(--success)' : 'var(--danger)' }}>
                  {(tx.type === 'Income' || tx.type === 'INCOME' || tx.credit) ? '+' : '-'}{new Intl.NumberFormat('en-US').format(tx.amount || tx.credit || tx.debit || 0)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
