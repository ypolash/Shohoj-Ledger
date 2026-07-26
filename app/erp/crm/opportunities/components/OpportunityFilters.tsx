"use client";

import React from 'react';

interface OpportunityFiltersProps {
  onFilterChange: (filters: { stageId?: string, ownerId?: string }) => void;
}

export function OpportunityFilters({ onFilterChange }: OpportunityFiltersProps) {
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
      <select style={selectStyle} onChange={(e) => onFilterChange({ stageId: e.target.value })}>
        <option value="">All Stages</option>
        <option value="prospecting">Prospecting</option>
        <option value="qualification">Qualification</option>
        <option value="proposal">Proposal</option>
        <option value="negotiation">Negotiation</option>
        <option value="won">Closed Won</option>
        <option value="lost">Closed Lost</option>
      </select>

      <select style={selectStyle} onChange={(e) => onFilterChange({ ownerId: e.target.value })}>
        <option value="">All Owners</option>
        <option value="me">My Opportunities</option>
        <option value="unassigned">Unassigned</option>
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
