"use client";

import React from 'react';

export function SalesOrderTimeline() {
  const activities = [
    { id: 1, type: 'SHIPPED', title: 'Order Shipped', date: new Date().toISOString(), detail: 'Tracking No: TRK-1234567890' },
    { id: 2, type: 'CONFIRMED', title: 'Order Confirmed', date: new Date(Date.now() - 86400000).toISOString() },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0' }}>
      {activities.map((act, index) => {
        let icon = 'history';
        let color = 'var(--gray-500)';

        if (act.type === 'CONFIRMED') { icon = 'thumb_up'; color = 'var(--info)'; }
        if (act.type === 'PROCESSING') { icon = 'sync'; color = 'var(--warning)'; }
        if (act.type === 'SHIPPED') { icon = 'local_shipping'; color = 'var(--primary)'; }
        if (act.type === 'COMPLETED') { icon = 'check_circle'; color = 'var(--success)'; }

        return (
          <div key={act.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
            {index !== activities.length - 1 && (
              <div style={{ 
                position: 'absolute', left: '15px', top: '32px', bottom: '-20px', 
                width: '2px', background: 'var(--border-main)', zIndex: 0
              }} />
            )}
            
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: `color-mix(in srgb, ${color} 15%, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1, border: `1px solid ${color}`
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: color }}>{icon}</span>
            </div>
            
            <div style={{ flex: 1, background: 'var(--surface-hover)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{act.title}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(act.date).toLocaleString()}</span>
              </div>
              {act.detail && <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-main)' }}>{act.detail}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
