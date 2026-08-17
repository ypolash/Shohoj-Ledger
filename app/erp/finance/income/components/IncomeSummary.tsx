"use client";

import React from 'react';

export function IncomeSummary({ income }: { income?: any }) {
  if (!income) return null;

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>INC-{income.id.split('-')[0].toUpperCase()}</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>{income.description || income.category}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Amount Received</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)' }}>৳ {Number(income.received).toLocaleString()}</div>
          <span style={{ 
            display: 'inline-block', marginTop: '8px', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
            background: income.paymentStatus === 'PAID' ? 'var(--success-glow)' : 'var(--warning-glow)', 
            color: income.paymentStatus === 'PAID' ? 'var(--success)' : 'var(--warning)'
          }}>
            {income.paymentStatus || 'PENDING'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Date</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>{new Date(income.createdAt).toLocaleDateString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Amount</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--primary)' }}>৳ {Number(income.amount).toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Category</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>{income.category}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Deposit Account</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>{income.source || 'N/A'}</div>
        </div>
      </div>
    </div>
  );
}
