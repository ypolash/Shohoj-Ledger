"use client";

import React from 'react';
import { PeriodSelector } from './PeriodSelector';

export function ReportFilters() {
  return (
    <div className="glass-card" style={{ padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
      <PeriodSelector />
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <select style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '12px' }}>
          <option>All Accounts</option>
          <option>Operating Accounts</option>
          <option>Reserve Accounts</option>
        </select>
        
        <button style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--primary)', border: 'none', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Apply Filters</button>
      </div>
    </div>
  );
}
