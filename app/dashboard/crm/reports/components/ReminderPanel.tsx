"use client";

import React from 'react';

export function ReminderPanel() {
  const alerts = [
    { id: 1, title: 'Quotation Expiring Today', detail: 'QT-2026-001 for Acme Corp', type: 'DANGER' },
    { id: 2, title: 'Follow-up Required', detail: 'Soylent Corp hasn\'t responded in 7 days.', type: 'WARNING' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', background: 'var(--danger-glow)', border: '1px solid var(--danger)' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
        Action Needed
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {alerts.map(alert => (
          <div key={alert.id} style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>{alert.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{alert.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
