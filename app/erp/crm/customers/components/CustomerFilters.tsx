"use client";

import React, { useState } from 'react';

interface CustomerFiltersProps {
  onFilterChange?: (filters: any) => void;
}

export function CustomerFilters({ onFilterChange }: CustomerFiltersProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '12px', 
      padding: '16px', 
      background: 'var(--surface-main)', 
      borderRadius: '8px',
      border: '1px solid var(--border-main)',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
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

        <button 
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          style={{
            padding: '8px 16px',
            background: showMoreFilters ? 'var(--surface-hover)' : 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{showMoreFilters ? 'expand_less' : 'filter_alt'}</span>
          {showMoreFilters ? 'Less Filters' : 'More Filters'}
        </button>
      </div>

      {showMoreFilters && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
          <select 
            onChange={(e) => onFilterChange && onFilterChange({ hasCreditLimit: e.target.value })}
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
            <option value="">Credit Limit (Any)</option>
            <option value="yes">Has Credit Limit</option>
            <option value="no">No Credit Limit</option>
          </select>
          <select 
            onChange={(e) => onFilterChange && onFilterChange({ hasBalance: e.target.value })}
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
            <option value="">Balance (Any)</option>
            <option value="positive">Has Outstanding Balance</option>
            <option value="zero">Zero Balance</option>
          </select>
        </div>
      )}
    </div>
  );
}
