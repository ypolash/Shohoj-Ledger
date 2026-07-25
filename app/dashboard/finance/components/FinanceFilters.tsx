"use client";

import React from 'react';

export function FinanceFilters() {
  return (
    <div className="glass-card" style={{ padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_list</span>
        Filters:
      </div>
      
      <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px' }}>
        <option>This Quarter</option>
        <option>Last Quarter</option>
        <option>This Year (YTD)</option>
        <option>Last Year</option>
      </select>
      
      <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px' }}>
        <option>All Accounts</option>
        <option>Bank Accounts</option>
        <option>Cash Accounts</option>
        <option>Mobile Banking</option>
      </select>
      
      <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px' }}>
        <option>All Categories</option>
        <option>Operating Expenses</option>
        <option>Cost of Goods Sold</option>
        <option>Sales Revenue</option>
      </select>
    </div>
  );
}
