"use client";

import React from 'react';

export function PeriodSelector() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <select style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600 }}>
        <option>This Month</option>
        <option>Last Month</option>
        <option>This Quarter</option>
        <option>This Year</option>
        <option>Custom Range</option>
      </select>
      
      <span style={{ color: 'var(--text-muted)' }}>or</span>
      
      <input type="date" style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '12px' }} />
      <span style={{ color: 'var(--text-muted)' }}>to</span>
      <input type="date" style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '12px' }} />
    </div>
  );
}
