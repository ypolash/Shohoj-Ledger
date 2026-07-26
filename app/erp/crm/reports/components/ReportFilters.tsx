"use client";

import React from 'react';

export function ReportFilters() {
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
      <select style={selectStyle}>
        <option value="">All Salespersons</option>
        <option value="jane">Jane Smith</option>
        <option value="robert">Robert Chen</option>
        <option value="emily">Emily Davis</option>
      </select>

      <select style={selectStyle}>
        <option value="">All Regions</option>
        <option value="dhaka">Dhaka</option>
        <option value="chattogram">Chattogram</option>
      </select>
      
      <select style={selectStyle}>
        <option value="">All Products</option>
        <option value="software">Enterprise Software</option>
        <option value="hardware">Hardware Servers</option>
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
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_list</span>
        More Filters
      </button>
    </div>
  );
}
