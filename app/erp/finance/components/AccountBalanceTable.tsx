"use client";

import React from 'react';

export function AccountBalanceTable({ data }: { data?: any }) {
  const accounts = data?.accounts || [];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Account Balances</h3>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>View All</button>
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)' }}>
            <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Account Name</th>
            <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Type</th>
            <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Acc No</th>
            <th style={{ paddingBottom: '12px', fontWeight: 600, textAlign: 'right' }}>Balance (BDT)</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {accounts.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No accounts found.</td>
            </tr>
          ) : (
            accounts.map((acc: any, i: number) => (
              <tr key={i} style={{ borderBottom: i !== accounts.length -1 ? '1px solid var(--border-light)' : 'none' }}>
                <td style={{ padding: '16px 0', fontWeight: 600, color: 'var(--text-main)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{acc.type === 'Bank' ? 'account_balance' : acc.type === 'Cash' ? 'payments' : 'smartphone'}</span>
                    </div>
                    {acc.name}
                  </div>
                </td>
                <td style={{ padding: '16px 0', color: 'var(--text-muted)' }}>{acc.type}</td>
                <td style={{ padding: '16px 0', color: 'var(--text-muted)' }}>{acc.accNo}</td>
                <td style={{ padding: '16px 0', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>
                  {new Intl.NumberFormat('en-US').format(acc.balance || 0)}
                  <div style={{ fontSize: '11px', color: (acc.trend || '').startsWith('+') ? 'var(--success)' : (acc.trend || '').startsWith('-') ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 500 }}>
                    {acc.trend}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
