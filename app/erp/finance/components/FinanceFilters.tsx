"use client";

import React from 'react';

interface FinanceFiltersProps {
  period: string;
  onPeriodChange: (period: string) => void;
  year: number;
  onYearChange: (year: number) => void;
  month: string;
  onMonthChange: (month: string) => void;
  account: string;
  onAccountChange: (account: string) => void;
  availableYears?: number[];
  periodLabel?: string;
}

const MONTHS = [
  { value: "ALL", label: "All Months (Full Year)" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function FinanceFilters({
  period,
  onPeriodChange,
  year,
  onYearChange,
  month,
  onMonthChange,
  account,
  onAccountChange,
  availableYears = [2026, 2025],
  periodLabel
}: FinanceFiltersProps) {
  const currentYear = new Date().getFullYear();
  const yearsList = availableYears.length > 0 ? availableYears : [currentYear];

  const handlePeriodSelect = (p: string) => {
    onPeriodChange(p);
    if (p !== 'custom') {
      onMonthChange("ALL");
    }
  };

  const handleMonthSelect = (m: string) => {
    onMonthChange(m);
    if (m !== "ALL") {
      onPeriodChange("custom");
    } else {
      onPeriodChange("this_year");
    }
  };

  return (
    <div 
      className="glass-card" 
      style={{ 
        padding: '14px 20px', 
        borderRadius: '12px', 
        marginBottom: '24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: '16px', 
        flexWrap: 'wrap',
        border: '1px solid var(--border-light)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>calendar_month</span>
          Period View:
        </div>

        {/* Quick Period Buttons */}
        <div style={{ display: 'flex', background: 'var(--surface-main)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-light)', gap: '2px' }}>
          {[
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'this_quarter', label: 'This Quarter' },
            { id: 'this_year', label: 'Full Year' },
            { id: 'all', label: 'All Time' }
          ].map(p => {
            const isActive = period === p.id && month === 'ALL';
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodSelect(p.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Specific Month Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Month:</span>
          <select 
            value={month}
            onChange={(e) => handleMonthSelect(e.target.value)}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '6px', 
              border: '1px solid var(--border-light)', 
              background: 'var(--surface-main)', 
              color: 'var(--text-main)', 
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Year Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Year:</span>
          <select 
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '6px', 
              border: '1px solid var(--border-light)', 
              background: 'var(--surface-main)', 
              color: 'var(--text-main)', 
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {yearsList.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Account Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Account:</span>
          <select 
            value={account}
            onChange={(e) => onAccountChange(e.target.value)}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '6px', 
              border: '1px solid var(--border-light)', 
              background: 'var(--surface-main)', 
              color: 'var(--text-main)', 
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Accounts</option>
            <option value="BANK">Bank Accounts</option>
            <option value="CASH">Cash in Hand</option>
            <option value="BKASH">bKash / MFS</option>
          </select>
        </div>
      </div>

      {/* Active Filter Indicator Badge */}
      {periodLabel && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          padding: '4px 10px', 
          borderRadius: '20px', 
          background: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.25)', 
          color: '#60a5fa', 
          fontSize: '12px',
          fontWeight: 600
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>visibility</span>
          Showing: {periodLabel}
        </div>
      )}
    </div>
  );
}
