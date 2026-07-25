"use client";

import React from 'react';

export function ExpenseSearch() {
  return (
    <div style={{ position: 'relative' }}>
      <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }}>search</span>
      <input 
        type="text" 
        placeholder="Search reference or payee..." 
        style={{ 
          padding: '8px 16px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-main)', 
          background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px', width: '250px'
        }} 
      />
    </div>
  );
}
