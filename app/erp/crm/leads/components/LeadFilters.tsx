"use client";

import React, { useState } from 'react';

interface LeadFiltersProps {
  filters?: any;
  onFilterChange?: (filters: any) => void;
}

export function LeadFilters({ filters = {}, onFilterChange }: LeadFiltersProps) {
  const [showMore, setShowMore] = useState(false);

  const handleChange = (key: string, value: string) => {
    if (onFilterChange) {
      onFilterChange({ [key]: value });
    }
  };

  const handleReset = () => {
    if (onFilterChange) {
      onFilterChange({
        status: '',
        priority: '',
        source: '',
        assignedToId: '',
        dateFrom: '',
        dateTo: ''
      });
    }
  };

  const selectStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-light)',
    background: 'var(--bg-main)',
    fontSize: '13px',
    color: 'var(--text-main)',
    outline: 'none',
    cursor: 'pointer'
  };

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-light)',
    background: 'var(--bg-main)',
    fontSize: '13px',
    color: 'var(--text-main)',
    outline: 'none'
  };

  const hasActiveFilters = Boolean(
    filters.status || filters.priority || filters.source || filters.assignedToId || filters.dateFrom || filters.dateTo
  );

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '12px', 
      padding: '16px', 
      background: 'var(--surface-main)', 
      borderRadius: '12px',
      border: '1px solid var(--border-main)',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        {/* Status Filter */}
        <select 
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
          style={selectStyle}
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

        {/* Priority Filter */}
        <select 
          value={filters.priority || ''}
          onChange={(e) => handleChange('priority', e.target.value)}
          style={selectStyle}
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>

        {/* Source Filter */}
        <select 
          value={filters.source || ''}
          onChange={(e) => handleChange('source', e.target.value)}
          style={selectStyle}
        >
          <option value="">All Sources</option>
          <option value="Website">Website</option>
          <option value="Referral">Referral</option>
          <option value="Cold Call">Cold Call</option>
          <option value="Social Media">Social Media</option>
          <option value="Event / Expo">Event / Expo</option>
          <option value="Direct Campaign">Direct Campaign</option>
        </select>

        {/* More Filters Toggle Button */}
        <button 
          type="button"
          onClick={() => setShowMore(!showMore)}
          style={{
            padding: '8px 16px',
            background: showMore ? 'var(--primary-glow)' : 'var(--surface-hover)',
            border: `1px solid ${showMore ? 'var(--primary)' : 'var(--border-main)'}`,
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            color: showMore ? 'var(--primary)' : 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            {showMore ? 'tune' : 'filter_alt'}
          </span>
          {showMore ? 'Hide Filters' : 'More Filters'}
        </button>

        {/* Clear / Reset Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              border: 'none',
              color: 'var(--danger)',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>clear_all</span>
            Reset Filters
          </button>
        )}
      </div>

      {/* Expandable Advanced Filters Drawer */}
      {showMore && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-light)'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Created From
            </label>
            <input 
              type="date" 
              value={filters.dateFrom || ''} 
              onChange={(e) => handleChange('dateFrom', e.target.value)} 
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Created To
            </label>
            <input 
              type="date" 
              value={filters.dateTo || ''} 
              onChange={(e) => handleChange('dateTo', e.target.value)} 
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
