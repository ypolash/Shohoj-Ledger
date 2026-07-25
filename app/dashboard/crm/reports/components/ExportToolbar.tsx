"use client";

import React from 'react';

export function ExportToolbar() {
  const btnStyle = {
    padding: '8px 16px',
    background: 'var(--surface-hover)',
    border: '1px solid var(--border-main)',
    color: 'var(--text-main)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderRadius: '8px'
  };

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
      <button style={btnStyle} onClick={() => alert("Downloading CSV...")}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
        Export CSV
      </button>

      <button style={{ ...btnStyle, color: 'var(--danger)' }} onClick={() => window.print()}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>picture_as_pdf</span>
        Print PDF
      </button>
    </div>
  );
}
