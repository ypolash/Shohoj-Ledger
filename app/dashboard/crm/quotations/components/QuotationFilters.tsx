"use client";

import React from 'react';

interface QuotationFiltersProps {
  onFilterChange: (filters: { status?: string, dateRange?: string }) => void;
}

export function QuotationFilters({ onFilterChange }: QuotationFiltersProps) {
  const selectStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-main)',
    background: 'var(--bg-main)',
    color: 'var(--text-main)',
    fontSize: '13px',
    outline: 'none',
    minWidth: '150px'
  };

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '16px', background: 'var(--surface-main)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
      <select style={selectStyle} onChange={(e) => onFilterChange({ status: e.target.value })}>
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="viewed">Viewed</option>
        <option value="accepted">Accepted</option>
        <option value="rejected">Rejected</option>
        <option value="expired">Expired</option>
      </select>

      <select style={selectStyle} onChange={(e) => onFilterChange({ dateRange: e.target.value })}>
        <option value="">All Time</option>
        <option value="this_month">This Month</option>
        <option value="last_month">Last Month</option>
        <option value="this_year">This Year</option>
      </select>

      <button style={{
        padding: '8px 16px',
        background: 'transparent',
        border: '1px solid var(--border-main)',
        color: 'var(--text-main)',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
        More Filters
      </button>
    </div>
  );
}
