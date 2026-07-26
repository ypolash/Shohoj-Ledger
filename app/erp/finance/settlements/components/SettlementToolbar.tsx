"use client";

import React from 'react';

export function SettlementToolbar() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Bank Settlements</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Manage gateway and batch clearing settlements</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
          borderRadius: '8px', background: 'var(--primary)', color: 'white', 
          border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' 
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          New Settlement
        </button>
      </div>
    </div>
  );
}
