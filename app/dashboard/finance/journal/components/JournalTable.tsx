"use client";

import React from 'react';
import Link from 'next/link';

export function JournalTable() {
  const journals = [
    { id: '1', entryNo: 'JV-2026-001', date: '2026-07-26', reference: 'Rent Invoice #443', desc: 'July Office Rent', debit: 250000, credit: 250000, status: 'Posted', balanced: true, user: 'Admin' },
    { id: '2', entryNo: 'JV-2026-002', date: '2026-07-25', reference: 'INV-2026-90', desc: 'Software License Revenue', debit: 1250000, credit: 1250000, status: 'Posted', balanced: true, user: 'Admin' },
    { id: '3', entryNo: 'JV-2026-003', date: '2026-07-25', reference: 'Petty Cash', desc: 'Office Snacks Replenish', debit: 5000, credit: 5000, status: 'Draft', balanced: true, user: 'User 1' },
    { id: '4', entryNo: 'JV-2026-004', date: '2026-07-24', reference: 'Salary July', desc: 'July Employee Salaries', debit: 2800000, credit: 2800000, status: 'Draft', balanced: false, user: 'Admin' },
  ];

  return (
    <div className="glass-card" style={{ borderRadius: '12px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Entry No</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Reference</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Description</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Debit (BDT)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Credit (BDT)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Balanced</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {journals.map((jv, i) => (
            <tr key={jv.id} style={{ borderBottom: i !== journals.length -1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.2s' }}>
              <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{jv.entryNo}</td>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{jv.date}</td>
              <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: 500 }}>{jv.reference}</td>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{jv.desc}</td>
              <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>
                {new Intl.NumberFormat('en-US').format(jv.debit)}
              </td>
              <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>
                {new Intl.NumberFormat('en-US').format(jv.credit)}
              </td>
              <td style={{ padding: '16px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: jv.balanced ? 'var(--success)' : 'var(--danger)' }}>
                  {jv.balanced ? 'check_circle' : 'error'}
                </span>
              </td>
              <td style={{ padding: '16px', textAlign: 'center' }}>
                <span style={{ 
                  padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                  background: jv.status === 'Posted' ? 'var(--success-glow)' : 'var(--warning-glow)',
                  color: jv.status === 'Posted' ? 'var(--success)' : 'var(--warning)'
                }}>
                  {jv.status}
                </span>
              </td>
              <td style={{ padding: '16px', textAlign: 'right' }}>
                <Link href={'/dashboard/finance/journal/' + jv.id} style={{ 
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
