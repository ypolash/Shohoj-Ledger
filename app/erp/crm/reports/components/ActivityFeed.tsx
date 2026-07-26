"use client";

import React from 'react';

export function ActivityFeed() {
  const activities = [
    { id: 1, type: 'CALL', title: 'Discovery Call with Acme Corp', user: 'Jane Smith', date: new Date().toISOString(), detail: 'Discussed Q3 requirements. Need to send proposal by Friday.' },
    { id: 2, type: 'EMAIL', title: 'Sent Quotation QT-2026-001', user: 'Robert Chen', date: new Date(Date.now() - 3600000).toISOString(), detail: 'Emailed to john.doe@acme.com' },
    { id: 3, type: 'MEETING', title: 'Product Demo', user: 'Jane Smith', date: new Date(Date.now() - 86400000).toISOString(), detail: 'Demoed the enterprise tier. Very positive reception.' },
    { id: 4, type: 'TASK', title: 'Follow up on payment', user: 'Emily Davis', date: new Date(Date.now() - 172800000).toISOString(), detail: 'Invoice INV-2026-002 is 5 days overdue.' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Recent Activities</h3>
        <button style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: 'none' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Log Activity
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {activities.map((act, index) => {
          let icon = 'event_note';
          let color = 'var(--gray-500)';

          if (act.type === 'CALL') { icon = 'call'; color = 'var(--info)'; }
          if (act.type === 'EMAIL') { icon = 'mail'; color = 'var(--warning)'; }
          if (act.type === 'MEETING') { icon = 'videocam'; color = 'var(--primary)'; }
          if (act.type === 'TASK') { icon = 'check_circle'; color = 'var(--success)'; }

          return (
            <div key={act.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
              {index !== activities.length - 1 && (
                <div style={{ 
                  position: 'absolute', left: '19px', top: '40px', bottom: '-24px', 
                  width: '2px', background: 'var(--border-light)', zIndex: 0
                }} />
              )}
              
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '50%', 
                background: `color-mix(in srgb, ${color} 15%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1, border: `1px solid ${color}`
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: color }}>{icon}</span>
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{act.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>logged by <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{act.user}</span></div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(act.date).toLocaleString()}</span>
                </div>
                {act.detail && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-main)', background: 'var(--surface-hover)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    {act.detail}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
