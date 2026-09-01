"use client";

import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, RotateCcw, X } from 'lucide-react';

interface CustomerFiltersProps {
  filters: {
    status?: string;
    groupId?: string;
    hasCreditLimit?: string;
    hasBalance?: string;
    query?: string;
  };
  onFilterChange: (filters: Partial<{ status: string; groupId: string; hasCreditLimit: string; hasBalance: string }>) => void;
  onResetFilters: () => void;
}

export function CustomerFilters({ filters, onFilterChange, onResetFilters }: CustomerFiltersProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Fetch real customer groups from API
  useEffect(() => {
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const res = await fetch('/api/crm/customer-groups');
        if (res.ok) {
          const data = await res.json();
          setGroups(Array.isArray(data) ? data : data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch customer groups:", err);
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, []);

  // Calculate active filter count (excluding query)
  const activeCount = [
    filters.status,
    filters.groupId,
    filters.hasCreditLimit,
    filters.hasBalance
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
    minWidth: '150px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  };

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
          
          {/* Status Dropdown */}
          <select 
            value={filters.status || ""}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            style={{
              ...selectStyle,
              borderColor: filters.status ? 'var(--primary)' : 'var(--border-main)',
              backgroundColor: filters.status ? 'var(--primary-50, rgba(37, 99, 235, 0.05))' : 'var(--surface-main)'
            }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </select>

          {/* Group Dropdown */}
          <select 
            value={filters.groupId || ""}
            onChange={(e) => onFilterChange({ groupId: e.target.value })}
            style={{
              ...selectStyle,
              borderColor: filters.groupId ? 'var(--primary)' : 'var(--border-main)',
              backgroundColor: filters.groupId ? 'var(--primary-50, rgba(37, 99, 235, 0.05))' : 'var(--surface-main)'
            }}
          >
            <option value="">All Segments / Groups</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>

          {/* Toggle More Filters */}
          <button 
            type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            style={{
              padding: '8px 14px',
              background: showMoreFilters ? 'var(--surface-hover)' : 'var(--surface-main)',
              border: '1px solid var(--border-main)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <SlidersHorizontal size={15} color="var(--primary)" />
            <span>{showMoreFilters ? 'Fewer Filters' : 'More Filters'}</span>
            {activeCount > 0 && (
              <span style={{
                background: 'var(--primary)',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '9999px'
              }}>
                {activeCount}
              </span>
            )}
          </button>
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

      {/* Expanded Filter Options */}
      {showMoreFilters && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '12px', 
          paddingTop: '14px', 
          borderTop: '1px solid var(--border-main)',
          animation: 'fadeIn 0.2s ease'
        }}>
          {/* Credit Limit Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Credit Limit
            </label>
            <select 
              value={filters.hasCreditLimit || ""}
              onChange={(e) => onFilterChange({ hasCreditLimit: e.target.value })}
              style={selectStyle}
            >
              <option value="">Any Credit Limit</option>
              <option value="yes">Has Active Credit Limit</option>
              <option value="no">No Credit Limit</option>
            </select>
          </div>

          {/* Balance Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Outstanding Balance
            </label>
            <select 
              value={filters.hasBalance || ""}
              onChange={(e) => onFilterChange({ hasBalance: e.target.value })}
              style={selectStyle}
            >
              <option value="">Any Balance</option>
              <option value="positive">Has Outstanding Balance</option>
              <option value="zero">Zero / Cleared Balance</option>
            </select>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Filters:</span>
          
          {filters.status && (
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
              Status: <strong>{filters.status}</strong>
              <X 
                size={12} 
                style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
                onClick={() => onFilterChange({ status: '' })}
              />
            </span>
          )}

          {filters.groupId && (
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
              Group: <strong>{groups.find(g => g.id === filters.groupId)?.name || 'Selected'}</strong>
              <X 
                size={12} 
                style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
                onClick={() => onFilterChange({ groupId: '' })}
              />
            </span>
          )}

          {filters.hasCreditLimit && (
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
              Credit: <strong>{filters.hasCreditLimit === 'yes' ? 'Has Limit' : 'No Limit'}</strong>
              <X 
                size={12} 
                style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
                onClick={() => onFilterChange({ hasCreditLimit: '' })}
              />
            </span>
          )}

          {filters.hasBalance && (
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
              Balance: <strong>{filters.hasBalance === 'positive' ? 'Outstanding' : 'Zero Balance'}</strong>
              <X 
                size={12} 
                style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
                onClick={() => onFilterChange({ hasBalance: '' })}
              />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
