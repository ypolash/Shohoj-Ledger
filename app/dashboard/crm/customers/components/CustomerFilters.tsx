"use client";

import React from 'react';

interface CustomerFiltersProps {
  onFilterChange?: (filters: any) => void;
}

export function CustomerFilters({ onFilterChange }: CustomerFiltersProps) {
  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '12px', 
      padding: '16px', 
      background: 'var(--surface-main)', 
      borderRadius: '8px',
      border: '1px solid var(--border-main)',
      marginBottom: '16px'
    }}>
      <select 
        onChange={(e) => onFilterChange && onFilterChange({ status: e.target.value })}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border-light)',
          background: 'var(--bg-main)',
          fontSize: '13px',
          color: 'var(--text-main)',
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        <option value="">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="On Hold">On Hold</option>
      </select>

      <select 
        onChange={(e) => onFilterChange && onFilterChange({ groupId: e.target.value })}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border-light)',
          background: 'var(--bg-main)',
          fontSize: '13px',
          color: 'var(--text-main)',
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        <option value="">All Groups</option>
        <option value="retail">Retail</option>
        <option value="wholesale">Wholesale</option>
        <option value="enterprise">Enterprise</option>
      </select>

      <button style={{
        padding: '8px 16px',
        background: 'var(--surface-hover)',
        border: '1px solid var(--border-main)',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--text-main)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_alt</span>
        More Filters
      </button>
    </div>
  );
}
