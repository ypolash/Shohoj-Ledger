"use client";

import React from 'react';

export function ExpenseSummary() {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>EXP-2026-081</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>July Office Rent - Gulshan Branch</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Amount Paid</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--danger)' }}>৳ 250,000</div>
          <span style={{ 
            display: 'inline-block', marginTop: '8px', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
            background: 'var(--success-glow)', color: 'var(--success)'
          }}>
            Paid
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Date</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>Jul 25, 2026</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Payee</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--primary)' }}>Property Mgmt Inc</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Category</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>Rent & Utilities</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Paid From</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>City Bank (Main)</div>
        </div>
      </div>
    </div>
  );
}
