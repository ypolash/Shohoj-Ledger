"use client";

import React from 'react';

export function TrialBalanceTable() {
  return (
    <div className="glass-card" style={{ borderRadius: '12px', overflowX: 'auto', marginBottom: '24px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Account Code</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Account Name</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Debit (BDT)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Credit (BDT)</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {/* Assets */}
          <tr style={{ background: 'var(--surface-main)' }}>
            <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-main)' }}>Assets</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>1000</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>Cash and Cash Equivalents</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right', color: 'var(--text-main)' }}>2,500,000</td>
            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>1200</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>Accounts Receivable</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right', color: 'var(--text-main)' }}>1,250,000</td>
            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
          </tr>
          {/* Liabilities */}
          <tr style={{ background: 'var(--surface-main)' }}>
            <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-main)' }}>Liabilities</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>2000</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>Accounts Payable</td>
            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right', color: 'var(--danger)' }}>850,000</td>
          </tr>
          {/* Equity */}
          <tr style={{ background: 'var(--surface-main)' }}>
            <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-main)' }}>Equity</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>3000</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>Retained Earnings</td>
            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right', color: 'var(--danger)' }}>1,500,000</td>
          </tr>
          {/* Revenue */}
          <tr style={{ background: 'var(--surface-main)' }}>
            <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-main)' }}>Revenue</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>4000</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>Sales Revenue</td>
            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right', color: 'var(--danger)' }}>2,150,000</td>
          </tr>
          {/* Expenses */}
          <tr style={{ background: 'var(--surface-main)' }}>
            <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-main)' }}>Expenses</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>5000</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>Operating Expenses</td>
            <td style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right', color: 'var(--text-main)' }}>750,000</td>
            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
          </tr>
          
          {/* Totals */}
          <tr style={{ background: 'var(--surface-hover)' }}>
            <td colSpan={2} style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>Total</td>
            <td style={{ padding: '16px', fontWeight: 800, textAlign: 'right', color: 'var(--success)', borderTop: '2px solid var(--border-main)' }}>4,500,000</td>
            <td style={{ padding: '16px', fontWeight: 800, textAlign: 'right', color: 'var(--success)', borderTop: '2px solid var(--border-main)' }}>4,500,000</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
