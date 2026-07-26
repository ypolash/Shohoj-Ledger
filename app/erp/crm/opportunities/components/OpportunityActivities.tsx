"use client";

import React from 'react';

export function OpportunityActivities() {
  const activities = [
    { id: 1, title: 'Send revised quotation', date: 'Tomorrow, 10:00 AM', status: 'UPCOMING', type: 'TASK' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
          + Add Task
        </button>
      </div>
      {activities.map(act => {
        let statusColor = 'var(--gray-500)';
        if (act.status === 'UPCOMING') statusColor = 'var(--primary)';

        let icon = 'task';

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
          </div>
        );
      })}
    </div>
  );
}
