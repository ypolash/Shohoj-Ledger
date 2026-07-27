import React from 'react';
import Link from 'next/link';

export default function ReportsDashboardPage() {
  const categories = [
    {
      id: 'finance',
      title: 'Financial Reports',
      description: 'Trial balance, P&L, balance sheet, ledgers, and expense reports.',
      icon: 'account_balance',
      color: 'var(--primary)',
      link: '/erp/reports/finance'
    },
    {
      id: 'inventory',
      title: 'Inventory & Stock',
      description: 'Stock levels, valuation, transfer history, and warehouse analytics.',
      icon: 'inventory_2',
      color: 'var(--success)',
      link: '/erp/reports/finance' // Redirect to finance for now as placeholder
    },
    {
      id: 'hr',
      title: 'HR & Payroll',
      description: 'Employee cost analysis, attendance summaries, and payroll ledgers.',
      icon: 'groups',
      color: 'var(--warning)',
      link: '/erp/reports/finance' // Redirect to finance for now as placeholder
    },
    {
      id: 'crm',
      title: 'CRM & Sales',
      description: 'Revenue pipelines, lead conversions, and sales performance.',
      icon: 'trending_up',
      color: 'var(--accent)',
      link: '/erp/reports/finance' // Redirect to finance for now as placeholder
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      <div>
        <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Enterprise Reports Hub</h1>
        <p style={{ margin: '4px 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
          Centralized reporting and analytics for all ERP modules.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-5)' }}>
        {categories.map(cat => (
          <Link key={cat.id} href={cat.link} style={{ textDecoration: 'none' }}>
            <div className="glass-panel hover-lift" style={{ padding: '24px', borderRadius: '16px', display: 'flex', gap: '16px', height: '100%', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-main)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: cat.color }}>{cat.icon}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>{cat.title}</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{cat.description}</p>
                <div style={{ marginTop: 'auto', paddingTop: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Open Category <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
