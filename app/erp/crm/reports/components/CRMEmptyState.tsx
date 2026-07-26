"use client";

import React from 'react';

export function CRMEmptyState() {
  return (
    <div style={{ 
      padding: '64px 24px', 
      textAlign: 'center', 
      background: 'var(--surface-main)', 
      borderRadius: '12px', 
      border: '1px dashed var(--border-main)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{ 
        width: '64px', height: '64px', borderRadius: '50%', 
        background: 'var(--surface-hover)', color: 'var(--text-muted)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center' 
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>bar_chart</span>
      </div>
      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>No data available</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px' }}>
          There is no CRM data for the selected date range. Try adjusting your filters.
        </p>
      </div>
    </div>
  );
}
