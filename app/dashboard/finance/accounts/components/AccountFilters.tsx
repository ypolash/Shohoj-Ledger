"use client";

import React from 'react';
import { AccountSearch } from './AccountSearch';

export function AccountFilters() {
  return (
    <div className="glass-card" style={{ padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_list</span>
          Filters:
        </div>
        
        <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px' }}>
          <option>All Types</option>
          <option>Asset</option>
          <option>Liability</option>
          <option>Equity</option>
          <option>Revenue</option>
          <option>Expense</option>
        </select>
        
        <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px' }}>
          <option>All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Blocked</option>
        </select>
      </div>
      
      <AccountSearch />
    </div>
  );
}
