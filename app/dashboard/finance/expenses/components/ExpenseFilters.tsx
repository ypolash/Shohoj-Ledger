"use client";

import React from 'react';
import { ExpenseSearch } from './ExpenseSearch';

export function ExpenseFilters() {
  return (
    <div className="glass-card" style={{ padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_list</span>
          Filters:
        </div>
        
        <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px' }}>
          <option>All Categories</option>
          <option>Operating Expense</option>
          <option>Payroll Expense</option>
          <option>Marketing</option>
          <option>Rent & Utilities</option>
        </select>
        
        <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px' }}>
          <option>All Statuses</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Overdue</option>
        </select>
      </div>
      
      <ExpenseSearch />
    </div>
  );
}
