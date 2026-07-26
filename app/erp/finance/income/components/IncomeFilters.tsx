"use client";

import React from 'react';
import { IncomeSearch } from './IncomeSearch';

export function IncomeFilters() {
  return (
    <div className="glass-card" style={{ padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_list</span>
          Filters:
        </div>
        
        <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px' }}>
          <option>All Categories</option>
          <option>Sales Revenue</option>
          <option>Service Income</option>
          <option>Interest Income</option>
          <option>Other Income</option>
        </select>
        
        <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px' }}>
          <option>All Statuses</option>
          <option>Received</option>
          <option>Pending</option>
          <option>Overdue</option>
        </select>
      </div>
      
      <IncomeSearch />
    </div>
  );
}
