"use client";

import React from 'react';
import Link from 'next/link';
import { AccountTypeBadge } from './AccountTypeBadge';

export function AccountTable() {
  const accounts = [
    { id: '1000', code: '1000-01', name: 'Cash on Hand', type: 'Asset', parent: 'Current Assets', balance: 450000, status: 'Active' },
    { id: '1001', code: '1000-02', name: 'City Bank (Main)', type: 'Asset', parent: 'Bank Accounts', balance: 4500000, status: 'Active' },
    { id: '2000', code: '2000-01', name: 'Accounts Payable', type: 'Liability', parent: 'Current Liabilities', balance: 1280000, status: 'Active' },
    { id: '3000', code: '3000-01', name: 'Owner Equity', type: 'Equity', parent: 'Equity', balance: 15000000, status: 'Active' },
    { id: '4000', code: '4000-01', name: 'Product Sales', type: 'Revenue', parent: 'Operating Revenue', balance: 84500000, status: 'Active' },
    { id: '5000', code: '5000-01', name: 'Office Supplies', type: 'Expense', parent: 'Operating Expense', balance: 250000, status: 'Active' },
  ];

  return (
    <div className="glass-card" style={{ borderRadius: '12px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Code</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Account Name</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Type</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Parent Node</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Current Balance</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {accounts.map((acc, i) => (
            <tr key={acc.id} style={{ borderBottom: i !== accounts.length -1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.2s' }}>
              <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{acc.code}</td>
              <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{acc.name}</td>
              <td style={{ padding: '16px' }}>
                <AccountTypeBadge type={acc.type} />
              </td>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{acc.parent}</td>
              <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>
                {new Intl.NumberFormat('en-US').format(acc.balance)}
              </td>
              <td style={{ padding: '16px', textAlign: 'center' }}>
                <span style={{ 
                  padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                  background: acc.status === 'Active' ? 'var(--success-glow)' : 'var(--border-light)',
                  color: acc.status === 'Active' ? 'var(--success)' : 'var(--text-muted)'
                }}>
                  {acc.status}
                </span>
              </td>
              <td style={{ padding: '16px', textAlign: 'right' }}>
                <Link href={'/erp/finance/accounts/' + acc.id} style={{ 
                  padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, 
                  background: 'var(--surface-main)', color: 'var(--text-main)', border: '1px solid var(--border-main)', 
                  textDecoration: 'none', display: 'inline-block' 
                }}>
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
