"use client";

import React from 'react';
import Link from 'next/link';

interface LeadToolbarProps {
  onRefresh?: () => void;
  onAddLead?: () => void;
}

export function LeadToolbar({ onRefresh, onAddLead }: LeadToolbarProps) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <button style={{
        padding: '10px 16px',
        background: 'var(--surface-main)',
        border: '1px solid var(--border-main)',
        borderRadius: '8px',
        color: 'var(--text-main)',
        fontSize: '13px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
        Export
      </button>

      <button style={{
        padding: '10px 16px',
        background: 'var(--surface-main)',
        border: '1px solid var(--border-main)',
        borderRadius: '8px',
        color: 'var(--text-main)',
        fontSize: '13px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)'
      }} onClick={onRefresh}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
      </button>

      <button 
        onClick={onAddLead}
        style={{
          padding: '10px 20px',
          background: 'var(--primary)',
          border: '1px solid var(--primary-700)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)'
        }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
        New Lead
      </button>
    </div>
  );
}
