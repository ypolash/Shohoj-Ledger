"use client";

import React from 'react';

export function QuotationHistory() {
  const logs = [
    { id: 1, action: 'Status updated to Sent', user: 'Jane Smith', date: '2026-07-25 11:30 AM' },
    { id: 2, action: 'Quotation generated', user: 'Jane Smith', date: '2026-07-24 10:15 AM' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {logs.map(log => (
        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--surface-main)' }}>
          <div>
            <div style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px' }}>{log.action}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>by {log.user}</div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.date}</span>
        </div>
      ))}
    </div>
  );
}
