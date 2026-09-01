"use client";

import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, RotateCcw, X, Calendar } from 'lucide-react';

interface IncomeFiltersProps {
  filters: {
    category?: string;
    status?: string;
    dateRange?: string;
    query?: string;
  };
  onFilterChange: (filters: Partial<{ category: string; status: string; dateRange: string }>) => void;
  onResetFilters: () => void;
}

export function IncomeFilters({ filters, onFilterChange, onResetFilters }: IncomeFiltersProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/income-categories');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setCategories(data);
        }
      } catch (err) {
        console.error("Failed to fetch income categories", err);
      }
    };
    fetchCategories();
  }, []);

  const activeCount = [
    filters.category,
    filters.status,
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
          
          {/* Category Dropdown */}
          <select 
            value={filters.category || ""}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            style={{
              ...selectStyle,
              borderColor: filters.category ? 'var(--primary)' : 'var(--border-main)',
              backgroundColor: filters.category ? 'var(--primary-50, rgba(37, 99, 235, 0.05))' : 'var(--surface-main)'
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id || cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
            {categories.length === 0 && (
              <>
                <option value="Sales Revenue">Sales Revenue</option>
                <option value="Consulting">Consulting</option>
                <option value="Development">Development</option>
                <option value="Service Income">Service Income</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Support">Support</option>
                <option value="Training">Training</option>
                <option value="Other Income">Other Income</option>
              </>
            )}
          </select>

          {/* Payment Status Dropdown */}
          <select 
            value={filters.status || ""}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            style={{
              ...selectStyle,
              borderColor: filters.status ? 'var(--primary)' : 'var(--border-main)',
              backgroundColor: filters.status ? 'var(--primary-50, rgba(37, 99, 235, 0.05))' : 'var(--surface-main)'
            }}
          >
            <option value="">All Payment Statuses</option>
            <option value="PAID">Paid (Settled)</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="UNPAID">Unpaid (Outstanding)</option>
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
          
          {filters.category && (
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
              Category: <strong>{filters.category}</strong>
              <X 
                size={12} 
                style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
                onClick={() => onFilterChange({ category: '' })}
              />
            </span>
          )}

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
