"use client";

import React from 'react';
import { RotateCcw, X } from 'lucide-react';

interface AdvanceFiltersProps {
  members: any[];
  filters: {
    memberId?: string;
    dateRange?: string;
    query?: string;
  };
  onFilterChange: (filters: Partial<{ memberId: string; dateRange: string }>) => void;
  onResetFilters: () => void;
}

export function AdvanceFilters({ members = [], filters, onFilterChange, onResetFilters }: AdvanceFiltersProps) {
  const activeCount = [
    filters.memberId,
    filters.dateRange
  ].filter(Boolean).length;

  const selectStyle: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-main)',
    background: 'var(--surface-main)',
    fontSize: '0.85rem',
    color: 'var(--text-main)',
    outline: 'none',
    cursor: 'pointer',
    minWidth: '160px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  };

  const selectedMember = members.find(m => m.id === filters.memberId);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px 20px',
      background: 'var(--surface-main)',
      borderRadius: '12px',
      border: '1px solid var(--border-main)',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      {/* Top Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          
          {/* Employee Dropdown */}
          <select 
            value={filters.memberId || ""}
            onChange={(e) => onFilterChange({ memberId: e.target.value })}
            style={{
              ...selectStyle,
              borderColor: filters.memberId ? 'var(--primary)' : 'var(--border-main)',
              backgroundColor: filters.memberId ? 'var(--primary-50, rgba(37, 99, 235, 0.05))' : 'var(--surface-main)'
            }}
          >
            <option value="">All Staff Members</option>
            {members.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Date Range Dropdown */}
          <select 
            value={filters.dateRange || ""}
            onChange={(e) => onFilterChange({ dateRange: e.target.value })}
            style={{
              ...selectStyle,
              borderColor: filters.dateRange ? 'var(--primary)' : 'var(--border-main)',
              backgroundColor: filters.dateRange ? 'var(--primary-50, rgba(37, 99, 235, 0.05))' : 'var(--surface-main)'
            }}
          >
            <option value="">All Time</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year (YTD)</option>
          </select>
        </div>

        {/* Reset Filters Button */}
        {activeCount > 0 && (
          <button
            onClick={onResetFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'transparent',
              border: '1px dashed var(--border-main)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Filters:</span>
          
          {filters.memberId && selectedMember && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'var(--surface-hover)',
              border: '1px solid var(--border-main)',
              fontSize: '0.75rem',
              color: 'var(--text-main)'
            }}>
              Staff: <strong>{selectedMember.name}</strong>
              <X 
                size={12} 
                style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
                onClick={() => onFilterChange({ memberId: '' })}
              />
            </span>
          )}

          {filters.dateRange && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'var(--surface-hover)',
              border: '1px solid var(--border-main)',
              fontSize: '0.75rem',
              color: 'var(--text-main)'
            }}>
              Period: <strong>{filters.dateRange.replace('_', ' ').toUpperCase()}</strong>
              <X 
                size={12} 
                style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
                onClick={() => onFilterChange({ dateRange: '' })}
              />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
