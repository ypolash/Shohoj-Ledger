"use client";

import React from 'react';

interface LeadTimelineProps {
  activities: any[];
}

export function LeadTimeline({ activities }: LeadTimelineProps) {
  if (!activities || activities.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No timeline events found.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0' }}>
      {activities.map((act, index) => {
        let icon = 'history';
        let color = 'var(--gray-500)';

        if (act.type === 'CREATED') { icon = 'add_circle'; color = 'var(--success)'; }
        if (act.type === 'STATUS_CHANGE') { icon = 'swap_horiz'; color = 'var(--warning)'; }
        if (act.type === 'EMAIL') { icon = 'mail'; color = 'var(--info)'; }
        if (act.type === 'CALL') { icon = 'call'; color = 'var(--primary)'; }
        if (act.type === 'MEETING') { icon = 'event'; color = 'var(--accent)'; }
        if (act.type === 'NOTE') { icon = 'sticky_note_2'; color = 'var(--secondary)'; }

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
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: color }}>
                {icon}
              </span>
            </div>
            
            <div style={{ flex: 1, background: 'var(--surface-hover)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{act.description || act.type}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(act.createdAt).toLocaleString()}</span>
              </div>
              {act.newValue && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-main)', background: 'var(--bg-main)', padding: '8px', borderRadius: '4px' }}>
                  {act.oldValue ? <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginRight: '8px' }}>{act.oldValue}</span> : null}
                  <strong>{act.newValue}</strong>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
