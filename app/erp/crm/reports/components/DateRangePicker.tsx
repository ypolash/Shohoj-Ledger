"use client";

import React from 'react';

export function DateRangePicker() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-main)', border: '1px solid var(--border-main)', borderRadius: '6px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderRight: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
      </div>
      <select style={{ padding: '8px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
        <option>This Month</option>
        <option>Last Month</option>
        <option>This Quarter</option>
        <option>This Year (YTD)</option>
        <option>Custom Range...</option>
      </select>
    </div>
  );
}
