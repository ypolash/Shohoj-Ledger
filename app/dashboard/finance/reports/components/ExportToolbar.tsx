"use client";

import React from 'react';

export function ExportToolbar({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
      <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>{title}</h1>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>picture_as_pdf</span>
          PDF
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>table</span>
          Excel
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
          Print
        </button>
      </div>
    </div>
  );
}
