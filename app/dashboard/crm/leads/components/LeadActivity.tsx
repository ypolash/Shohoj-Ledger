"use client";

import React from 'react';

export function LeadActivity() {
  const activities = [
    { id: 1, title: 'Follow up call with Sarah', date: 'Tomorrow, 10:00 AM', status: 'UPCOMING', type: 'CALL' },
    { id: 2, title: 'Send pricing proposal', date: 'Today, 4:00 PM', status: 'OVERDUE', type: 'TASK' },
    { id: 3, title: 'Initial discovery meeting', date: 'Yesterday', status: 'COMPLETED', type: 'MEETING' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              <div style={{ fontSize: '14px', fontWeight: 600, color: act.status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: act.status === 'COMPLETED' ? 'line-through' : 'none' }}>
                {act.title}
              </div>
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
