"use client";

import React from 'react';

export function LeadHistory() {
  const historyLogs = [
    { id: 1, action: 'Lead Assigned', user: 'Admin User', date: '2026-07-25 09:00 AM', detail: 'Assigned to John Doe' },
    { id: 2, action: 'Status Changed', user: 'John Doe', date: '2026-07-25 10:30 AM', detail: 'New → Contacted' },
    { id: 3, action: 'Priority Updated', user: 'John Doe', date: '2026-07-25 10:35 AM', detail: 'Medium → High' },
  ];

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
          {historyLogs.map(log => (
            <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{log.date}</td>
              <td style={{ padding: '16px 12px', fontWeight: 500, color: 'var(--text-main)' }}>{log.action}</td>
              <td style={{ padding: '16px 12px' }}>{log.user}</td>
              <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{log.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
