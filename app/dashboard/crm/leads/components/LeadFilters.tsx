"use client";

import React from 'react';

interface LeadFiltersProps {
  onFilterChange?: (filters: any) => void;
}

export function LeadFilters({ onFilterChange }: LeadFiltersProps) {
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
        <option value="New">New</option>
        <option value="Contacted">Contacted</option>
        <option value="Qualified">Qualified</option>
        <option value="Proposal">Proposal</option>
        <option value="Negotiation">Negotiation</option>
        <option value="Won">Won</option>
        <option value="Lost">Lost</option>
      </select>

      <select 
        onChange={(e) => onFilterChange && onFilterChange({ priority: e.target.value })}
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
        <option value="">All Priorities</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Urgent">Urgent</option>
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
