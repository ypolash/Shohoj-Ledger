"use client";

import React from 'react';

interface SalesOrderFiltersProps {
  onFilterChange: (filters: { status?: string, paymentStatus?: string, shipmentStatus?: string }) => void;
}

export function SalesOrderFilters({ onFilterChange }: SalesOrderFiltersProps) {
  const selectStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-main)',
    background: 'var(--bg-main)',
    color: 'var(--text-main)',
    fontSize: '13px',
    outline: 'none',
    minWidth: '130px'
  };

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '16px', background: 'var(--surface-main)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
      <select style={selectStyle} onChange={(e) => onFilterChange({ status: e.target.value })}>
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="confirmed">Confirmed</option>
        <option value="processing">Processing</option>
        <option value="shipped">Shipped</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <select style={selectStyle} onChange={(e) => onFilterChange({ paymentStatus: e.target.value })}>
        <option value="">Payment Status</option>
        <option value="unpaid">Unpaid</option>
        <option value="partial">Partial</option>
        <option value="paid">Paid</option>
      </select>
      
      <select style={selectStyle} onChange={(e) => onFilterChange({ shipmentStatus: e.target.value })}>
        <option value="">Shipment Status</option>
        <option value="pending">Pending</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
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
