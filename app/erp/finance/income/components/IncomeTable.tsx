"use client";

import React from 'react';
import Link from 'next/link';

export function IncomeTable({ incomes = [] }: { incomes?: any[] }) {
  return (
    <div className="glass-card" style={{ borderRadius: '12px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Reference</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Payer / Source</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Category</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Amount (BDT)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {incomes.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No income records found.</td>
            </tr>
          ) : (
            incomes.map((inc, i) => (
              <tr key={inc.id} style={{ borderBottom: i !== incomes.length -1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.2s' }}>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(inc.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{inc.id.substring(0, 8).toUpperCase()}</td>
                <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{inc.source || 'N/A'}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{inc.category || 'N/A'}</td>
                <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>
                  {new Intl.NumberFormat('en-US').format(inc.amount || 0)}
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                    background: inc.paymentStatus === 'PAID' ? 'var(--success-glow)' : inc.paymentStatus === 'PARTIAL' ? 'var(--info-glow)' : 'var(--warning-glow)',
                    color: inc.paymentStatus === 'PAID' ? 'var(--success)' : inc.paymentStatus === 'PARTIAL' ? 'var(--info)' : 'var(--warning)'
                  }}>
                    {inc.paymentStatus || 'UNPAID'}
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
