"use client";

import React from 'react';

export function FinanceToolbar() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Finance Dashboard</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>CFO Overview & Enterprise Financials</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }}>search</span>
          <input 
            type="text" 
            placeholder="Global Finance Search..." 
            style={{ 
              padding: '8px 16px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-main)', 
              background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px', width: '250px'
            }} 
          />
        </div>
        
        <button style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
          borderRadius: '8px', background: 'var(--primary)', color: 'white', 
          border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' 
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          New Entry
        </button>
      </div>
    </div>
  );
}
