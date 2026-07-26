"use client";

import React from 'react';

interface CustomerFinancialSummaryProps {
  customer: any;
}

export function CustomerFinancialSummary({ customer }: CustomerFinancialSummaryProps) {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: customer.currency || 'BDT' });

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <h4 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Financial Summary</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Outstanding Balance</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--warning)' }}>{formatter.format(Number(customer.outstandingBalance || 0))}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Credit Limit</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>{formatter.format(Number(customer.creditLimit || 0))}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Sales (YTD)</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{formatter.format(150000)}</span> {/* Placeholder */}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Credit</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>
            {formatter.format(Math.max(0, Number(customer.creditLimit || 0) - Number(customer.outstandingBalance || 0)))}
          </span>
        </div>
      </div>
    </div>
  );
}
