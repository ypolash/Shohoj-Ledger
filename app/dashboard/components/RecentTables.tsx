"use client";

import React from 'react';
import Link from 'next/link';

interface RecentTablesProps {
  data: any;
  role: string;
}

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
};

export function RecentTables({ data, role }: RecentTablesProps) {
  if (!data) return null;

  const showFinance = ['Owner', 'CEO', 'Accountant'].includes(role);

  if (!showFinance) return null;

  return (
    <div className="glass-card" style={{ padding: '24px', overflowX: 'auto', borderRadius: '16px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, fontFamily: 'serif' }}>Recent Transactions</h3>
        <Link href="/dashboard/income" style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 600 }}>View Complete Ledger &rarr;</Link>
      </div>
      
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--border-light)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <th style={{ padding: '12px', fontWeight: 'normal' }}>Date</th>
            <th style={{ padding: '12px', fontWeight: 'normal' }}>Category</th>
            <th style={{ padding: '12px', fontWeight: 'normal', textAlign: 'right' }}>Amount</th>
            <th style={{ padding: '12px', fontWeight: 'normal', textAlign: 'center' }}>Status</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {data.recentTransactions && data.recentTransactions.length > 0 ? (
            data.recentTransactions.map((tx: any) => (
              <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', background: tx.type === 'INCOME' ? 'var(--success-glow)' : 'var(--danger-glow)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: tx.type === 'INCOME' ? 'var(--success)' : 'var(--danger)', margin: 'auto' }}>
                        {tx.type === 'INCOME' ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                        {typeof tx.category === 'object' && tx.category !== null ? tx.category.name : (tx.category || 'Uncategorized')}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tx.subtitle || '-'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{new Date(tx.date).toLocaleDateString()}</td>
                <td style={{ padding: '16px 12px', textAlign: 'right', color: tx.type === 'INCOME' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                </td>
                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: 'var(--border-light)', color: 'var(--text-muted)' }}>
                    Completed
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No recent transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
