"use client";

import React from 'react';

export function ExpenseSummary({ expense }: { expense?: any }) {
  if (!expense) return null;

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>EXP-{expense.id.split('-')[0].toUpperCase()}</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>{expense.description || expense.category}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Amount</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--danger)' }}>৳ {Number(expense.amount).toLocaleString()}</div>
          <span style={{ 
            display: 'inline-block', marginTop: '8px', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
            background: expense.approvalStatus === 'APPROVED' ? 'var(--success-glow)' : 'var(--warning-glow)', 
            color: expense.approvalStatus === 'APPROVED' ? 'var(--success)' : 'var(--warning)'
          }}>
            {expense.approvalStatus || 'PENDING'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Date</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>{new Date(expense.createdAt).toLocaleDateString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--primary)' }}>{expense.approvalStatus}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Category</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>{expense.category}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Paid From</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>{expense.paymentMethod}</div>
        </div>
      </div>
    </div>
  );
}
