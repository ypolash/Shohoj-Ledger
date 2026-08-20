"use client";

import React, { useState, useEffect } from 'react';

interface LeadActivityProps {
  leadId: string;
}

export function LeadActivity({ leadId }: LeadActivityProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (leadId) {
      fetch(`/api/crm/leads/${leadId}/activities`)
        .then(res => res.json())
        .then(data => {
          if (data.activities) {
            // Filter out notes and history, keep only tasks/calls/meetings
            const filtered = data.activities.filter((act: any) => 
              act.type && act.type.startsWith('FOLLOW_UP_')
            );
            setActivities(filtered);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [leadId]);

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading activities...</div>;
  }

  if (activities.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No activities found.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {activities.map(act => {
        let status = 'COMPLETED';
        let statusColor = 'var(--success)';
        
        // Determine status based on newValue (which stores the date)
        if (act.newValue) {
          const actDate = new Date(act.newValue);
          const now = new Date();
          if (actDate > now) {
            status = 'UPCOMING';
            statusColor = 'var(--primary)';
          } else {
            status = 'OVERDUE';
            statusColor = 'var(--danger)';
          }
        }

        let icon = 'task';
        if (act.type === 'FOLLOW_UP_CALL') icon = 'call';
        if (act.type === 'FOLLOW_UP_MEETING') icon = 'event';

        // Format date beautifully
        const dateStr = act.newValue ? new Date(act.newValue).toLocaleString() : new Date(act.createdAt).toLocaleString();

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
              <div style={{ fontSize: '14px', fontWeight: 600, color: status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: status === 'COMPLETED' ? 'line-through' : 'none' }}>
                {act.description || 'Activity'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{dateStr}</div>
            </div>

            <span style={{ 
              fontSize: '10px', fontWeight: 600, padding: '4px 8px', borderRadius: '12px',
              color: statusColor, background: `color-mix(in srgb, ${statusColor} 10%, transparent)`
            }}>
              {status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
