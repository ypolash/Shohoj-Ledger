import React from 'react';
import Link from 'next/link';

export default function FinanceReportsPage() {
  const reports = [
    { title: 'Executive Financial Statement', desc: 'Comprehensive Monthly, Weekly, Yearly & Custom performance with Cash Flow, Ledger & PDF/CSV Export', path: 'statement', icon: 'query_stats', featured: true },
    { title: 'Profit & Loss', desc: 'Income and expenses breakdown for a period', path: 'profit-loss', icon: 'trending_up' },
    { title: 'Cash Flow', desc: 'Cash generation, liquidity, and operational usage', path: 'cash-flow', icon: 'water_drop' },
    { title: 'Balance Sheet', desc: 'Assets, liabilities, and equity overview', path: 'balance-sheet', icon: 'account_balance_wallet' },
    { title: 'General Ledger', desc: 'Detailed view of all journal and transactional entries', path: 'general-ledger', icon: 'menu_book' },
    { title: 'Trial Balance', desc: 'Summary of all debit and credit balances', path: 'trial-balance', icon: 'account_balance' },
    { title: 'Account Statement', desc: 'Transactions for a specific bank or cash account', path: 'account-statement', icon: 'receipt_long' },
    { title: 'Tax Summary', desc: 'Aggregated tax calculations and obligations', path: 'tax-summary', icon: 'request_quote' },
    { title: 'A/R & A/P Aging', desc: 'Outstanding receivables and payables by period', path: 'aging', icon: 'hourglass_bottom' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>Enterprise Financial Reports</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Real-time financial statements, cash flow analytics, and multi-format exports
          </p>
        </div>
        <Link 
          href="/erp/finance/reports/statement"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '13px',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>query_stats</span>
          Open Financial Statement &rarr;
        </Link>
      </div>

      {/* Featured Hero Banner */}
      <Link href="/erp/finance/reports/statement" style={{ textDecoration: 'none', display: 'block', marginBottom: '24px' }}>
        <div 
          className="glass-card hover-lift" 
          style={{
            padding: '24px 28px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(147, 51, 234, 0.08) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>assessment</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                  Comprehensive Financial Statement & Ledger
                </h2>
                <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                  NEW • PDF / CSV EXPORT
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                Generate real-time Monthly, Weekly, Yearly, or Custom Date Range financial performance reports with Net Profit, Operating Cash Flow, Category Breakdowns, and full itemized ledger.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 700, fontSize: '13px' }}>
            Generate Report
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
          </div>
        </div>
      </Link>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {reports.map((report) => (
          <Link key={report.path} href={`/erp/finance/reports/${report.path}`} style={{ textDecoration: 'none' }}>
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
