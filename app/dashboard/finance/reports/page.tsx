import React from 'react';
import Link from 'next/link';

export default function FinanceReportsPage() {
  const reports = [
    { title: 'Trial Balance', desc: 'Summary of all debit and credit balances', path: 'trial-balance', icon: 'account_balance' },
    { title: 'Balance Sheet', desc: 'Assets, liabilities, and equity overview', path: 'balance-sheet', icon: 'account_balance_wallet' },
    { title: 'Profit & Loss', desc: 'Income and expenses for a period', path: 'profit-loss', icon: 'trending_up' },
    { title: 'Cash Flow', desc: 'Cash generation and usage', path: 'cash-flow', icon: 'water_drop' },
    { title: 'General Ledger', desc: 'Detailed view of all journal entries', path: 'general-ledger', icon: 'menu_book' },
    { title: 'Account Statement', desc: 'Transactions for a specific account', path: 'account-statement', icon: 'receipt_long' },
    { title: 'Tax Summary', desc: 'Aggregated tax calculations', path: 'tax-summary', icon: 'request_quote' },
    { title: 'A/R & A/P Aging', desc: 'Outstanding balances by period', path: 'aging', icon: 'hourglass_bottom' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Enterprise Financial Reports</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {reports.map((report) => (
          <Link key={report.path} href={`/dashboard/finance/reports/${report.path}`} style={{ textDecoration: 'none' }}>
            <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--surface-hover)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined">{report.icon}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{report.title}</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{report.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
