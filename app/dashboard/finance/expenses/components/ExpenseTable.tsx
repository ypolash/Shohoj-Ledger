"use client";

import React from 'react';
import Link from 'next/link';

export function ExpenseTable() {
  const expenses = [
    { id: '1', date: '2026-07-25', reference: 'EXP-2026-081', payee: 'Property Mgmt Inc', category: 'Rent & Utilities', account: 'City Bank (Main)', amount: 250000, status: 'Paid' },
    { id: '2', date: '2026-07-24', reference: 'EXP-2026-080', payee: 'AWS Amazon', category: 'Operating Expense', account: 'City Bank (Main)', amount: 45000, status: 'Paid' },
    { id: '3', date: '2026-07-23', reference: 'EXP-2026-079', payee: 'Facebook Ads', category: 'Marketing', account: 'Credit Card', amount: 125000, status: 'Paid' },
    { id: '4', date: '2026-07-22', reference: 'EXP-2026-078', payee: 'Office Supplies Ltd', category: 'Operating Expense', account: 'Petty Cash', amount: 5000, status: 'Pending' },
  ];

  return (
    <div className="glass-card" style={{ borderRadius: '12px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Reference</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Payee / Vendor</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Category</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Paid From</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Amount (BDT)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {expenses.map((exp, i) => (
            <tr key={exp.id} style={{ borderBottom: i !== expenses.length -1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.2s' }}>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{exp.date}</td>
              <td style={{ padding: '16px', fontWeight: 600, color: 'var(--danger)' }}>{exp.reference}</td>
              <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{exp.payee}</td>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{exp.category}</td>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{exp.account}</td>
              <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>
                {new Intl.NumberFormat('en-US').format(exp.amount)}
              </td>
              <td style={{ padding: '16px', textAlign: 'center' }}>
                <span style={{ 
                  padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                  background: exp.status === 'Paid' ? 'var(--success-glow)' : 'var(--warning-glow)',
                  color: exp.status === 'Paid' ? 'var(--success)' : 'var(--warning)'
                }}>
                  {exp.status}
                </span>
              </td>
              <td style={{ padding: '16px', textAlign: 'right' }}>
                <Link href={'/dashboard/finance/expenses/' + exp.id} style={{ 
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
