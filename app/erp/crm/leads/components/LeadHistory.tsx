"use client";

import React, { useState, useEffect } from 'react';

interface LeadHistoryProps {
  leadId: string;
}

export function LeadHistory({ leadId }: LeadHistoryProps) {
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (leadId) {
      fetch(`/api/crm/leads/${leadId}/activities`)
        .then(res => res.json())
        .then(data => {
          if (data.activities) {
            // Keep everything EXCEPT notes and tasks (FOLLOW_UP_)
            const logs = data.activities.filter((act: any) => 
              act.type !== 'NOTE' && !(act.type || '').startsWith('FOLLOW_UP_')
            );
            setHistoryLogs(logs);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [leadId]);

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</div>;
  }

  if (historyLogs.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No history available.</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-main)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px', fontWeight: 600 }}>Date & Time</th>
            <th style={{ padding: '12px', fontWeight: 600 }}>Action</th>
            <th style={{ padding: '12px', fontWeight: 600 }}>User</th>
            <th style={{ padding: '12px', fontWeight: 600 }}>Details</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {historyLogs.map(log => {
            const dateStr = new Date(log.createdAt).toLocaleString();
            
            // Format action to be more readable
            const actionFormat = (log.type || 'SYSTEM_ACTION').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
            
            const user = log.performedBy?.name || 'System';
            
            let detail = log.description || '';
            if (log.oldValue && log.newValue) {
              detail = `${log.oldValue} → ${log.newValue}`;
            }

            return (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{dateStr}</td>
                <td style={{ padding: '16px 12px', fontWeight: 500, color: 'var(--text-main)' }}>{actionFormat}</td>
                <td style={{ padding: '16px 12px' }}>{user}</td>
                <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{detail}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
