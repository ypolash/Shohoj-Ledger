"use client";

import React from 'react';

export function ReserveDashboard({ totalReserve = 0, transactions = [], onAction }: { totalReserve?: number, transactions?: any[], onAction?: (type: string) => void }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Total Corporate Reserve</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>
            ৳ {new Intl.NumberFormat('en-US').format(totalReserve)}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button onClick={() => onAction && onAction('DEPOSIT')} style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Deposit</button>
            <button onClick={() => onAction && onAction('WITHDRAWAL')} style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Withdraw</button>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', overflowX: 'auto' }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Reserve Transactions</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '16px', fontWeight: 600 }}>Type</th>
              <th style={{ padding: '16px', fontWeight: 600 }}>Reason</th>
              <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Amount (BDT)</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '13px' }}>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No reserve transactions found.</td>
              </tr>
            ) : (
              transactions.map((tx, i) => (
                <tr key={tx.id} style={{ borderBottom: i !== transactions.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '16px', fontWeight: 600, color: tx.type === 'DEPOSIT' ? 'var(--success)' : 'var(--danger)' }}>{tx.type}</td>
                  <td style={{ padding: '16px', color: 'var(--text-main)' }}>{tx.reason || '-'}</td>
                  <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>
                    {new Intl.NumberFormat('en-US').format(tx.amount || 0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
