"use client";

import React from 'react';
import Link from 'next/link';

export function LeadEmptyState() {
  return (
    <div className="glass-card" style={{ padding: '48px', textAlign: 'center', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '64px', height: '64px', background: 'var(--gray-100)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}}>
        <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--gray-400)' }}>group_off</span>
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 8px 0' }}>No Leads Found</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 24px 0', maxWidth: '300px' }}>
        There are currently no leads matching your filters, or you haven't added any yet.
      </p>
      <Link href="/dashboard/crm/leads/create" style={{ textDecoration: 'none' }}>
        <button style={{
          padding: '10px 20px',
          background: 'var(--primary)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Create First Lead
        </button>
      </Link>
    </div>
  );
}
