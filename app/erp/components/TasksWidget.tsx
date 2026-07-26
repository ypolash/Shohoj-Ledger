"use client";

import React from 'react';

export function TasksWidget() {
  const tasks = [
    { id: 1, title: 'Review Q3 Financials', status: 'OVERDUE', color: 'var(--danger)' },
    { id: 2, title: 'Approve Pending Leaves', status: 'TODAY', color: 'var(--warning)' },
    { id: 3, title: 'Client Meeting - ACME', status: 'UPCOMING', color: 'var(--primary)' },
    { id: 4, title: 'Onboard New Developer', status: 'COMPLETED', color: 'var(--success)' },
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', flex: 1, minWidth: '300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>My Tasks</h3>
        <span style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>View All</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tasks.map(t => (
          <div key={t.id} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '12px',
            border: '1px solid var(--border-light)',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="checkbox" checked={t.status === 'COMPLETED'} readOnly style={{ cursor: 'pointer', accentColor: 'var(--primary)' }} />
              <span style={{ 
                fontSize: '13px', 
                color: t.status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--text-main)',
                textDecoration: t.status === 'COMPLETED' ? 'line-through' : 'none'
              }}>
                {t.title}
              </span>
            </div>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 600, 
              padding: '2px 8px', 
              borderRadius: '12px',
              color: t.color,
              background: `color-mix(in srgb, ${t.color} 15%, transparent)`
            }}>
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
