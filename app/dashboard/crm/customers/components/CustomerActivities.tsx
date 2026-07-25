"use client";

import React from 'react';

export function CustomerActivities() {
  const activities = [
    { id: 1, title: 'Quarterly review meeting', date: 'Tomorrow, 10:00 AM', status: 'UPCOMING', type: 'MEETING' },
    { id: 2, title: 'Send updated catalogue', date: 'Today, 4:00 PM', status: 'OVERDUE', type: 'TASK' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
          + Add Activity
        </button>
      </div>
      {activities.map(act => {
        let statusColor = 'var(--gray-500)';
        if (act.status === 'UPCOMING') statusColor = 'var(--primary)';
        if (act.status === 'OVERDUE') statusColor = 'var(--danger)';
        if (act.status === 'COMPLETED') statusColor = 'var(--success)';

        let icon = 'task';
        if (act.type === 'CALL') icon = 'call';
        if (act.type === 'MEETING') icon = 'event';

        return (
          <div key={act.id} style={{ 
            display: 'flex', alignItems: 'center', gap: '16px', 
            padding: '16px', border: '1px solid var(--border-light)', 
            borderRadius: '8px', background: 'var(--surface-main)' 
          }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '8px', 
              background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ color: statusColor }}>{icon}</span>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{act.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{act.date}</div>
            </div>

            <span style={{ 
              fontSize: '10px', fontWeight: 600, padding: '4px 8px', borderRadius: '12px',
              color: statusColor, background: `color-mix(in srgb, ${statusColor} 10%, transparent)`
            }}>
              {act.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
