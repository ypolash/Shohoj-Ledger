"use client";

import React from 'react';
import Link from 'next/link';

export function IncomeTable() {
  const incomes = [
    { id: '1', date: '2026-07-26', reference: 'INV-2026-001', payer: 'Acme Corp', category: 'Sales Revenue', account: 'City Bank (Main)', amount: 1500000, status: 'Received' },
    { id: '2', date: '2026-07-25', reference: 'SRV-2026-042', payer: 'Stark Industries', category: 'Service Income', account: 'Cash on Hand', amount: 45000, status: 'Received' },
    { id: '3', date: '2026-07-22', reference: 'INT-07-26', payer: 'City Bank', category: 'Interest Income', account: 'City Bank (Savings)', amount: 12500, status: 'Received' },
    { id: '4', date: '2026-07-20', reference: 'INV-2026-009', payer: 'Wayne Ent', category: 'Sales Revenue', account: 'Standard Chartered', amount: 2500000, status: 'Pending' },
  ];

  return (
    <div className="glass-card" style={{ borderRadius: '12px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Reference</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Payer / Source</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Category</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Deposit Account</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Amount (BDT)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {incomes.map((inc, i) => (
            <tr key={inc.id} style={{ borderBottom: i !== incomes.length -1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.2s' }}>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{inc.date}</td>
              <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{inc.reference}</td>
              <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{inc.payer}</td>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{inc.category}</td>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{inc.account}</td>
              <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>
                {new Intl.NumberFormat('en-US').format(inc.amount)}
              </td>
              <td style={{ padding: '16px', textAlign: 'center' }}>
                <span style={{ 
                  padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                  background: inc.status === 'Received' ? 'var(--success-glow)' : 'var(--warning-glow)',
                  color: inc.status === 'Received' ? 'var(--success)' : 'var(--warning)'
                }}>
                  {inc.status}
                </span>
              </td>
              <td style={{ padding: '16px', textAlign: 'right' }}>
                <Link href={'/erp/finance/income/' + inc.id} style={{ 
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
