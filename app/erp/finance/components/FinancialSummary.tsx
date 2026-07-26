"use client";

import React from 'react';

export function FinancialSummary() {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Financial Summary (YTD)</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Gross Revenue</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>৳ 84.5M</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Cost of Goods Sold</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--danger)' }}>৳ 32.2M</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Gross Margin</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--info)' }}>61.9%</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Operating Expenses</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--warning)' }}>৳ 18.5M</div>
        </div>
      </div>
      
      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Net Income</div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)' }}>৳ 33.8M</div>
      </div>
    </div>
  );
}
