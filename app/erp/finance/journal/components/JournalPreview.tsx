"use client";

import React from 'react';

export function JournalPreview() {
  const journal = {
    entryNo: 'JV-2026-001',
    date: 'Jul 26, 2026',
    reference: 'Rent Invoice #443',
    desc: 'July Office Rent',
    status: 'Posted',
    user: 'Admin (admin@shohoj.app)',
    lines: [
      { account: '5000-01 Office Supplies', memo: 'Rent expense for July', debit: 250000, credit: 0 },
      { account: '2000-01 Accounts Payable', memo: 'Liability creation', debit: 0, credit: 250000 },
    ],
    totalDebit: 250000,
    totalCredit: 250000,
  };

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>{journal.entryNo}</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>{journal.desc}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ 
            padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
            background: 'var(--success-glow)', color: 'var(--success)'
          }}>
            {journal.status}
          </span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>{journal.date}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Reference</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>{journal.reference}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Created By</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>{journal.user}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Currency</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>BDT</div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-main)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Account</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Memo</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Debit</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Credit</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {journal.lines.map((line, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{line.account}</td>
              <td style={{ padding: '16px', color: 'var(--text-main)' }}>{line.memo}</td>
              <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>
                {line.debit > 0 ? new Intl.NumberFormat('en-US').format(line.debit) : '-'}
              </td>
              <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>
                {line.credit > 0 ? new Intl.NumberFormat('en-US').format(line.credit) : '-'}
              </td>
            </tr>
          ))}
          <tr style={{ background: 'var(--surface-hover)' }}>
            <td colSpan={2} style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>Total</td>
            <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
              {new Intl.NumberFormat('en-US').format(journal.totalDebit)}
            </td>
            <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
              {new Intl.NumberFormat('en-US').format(journal.totalCredit)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
