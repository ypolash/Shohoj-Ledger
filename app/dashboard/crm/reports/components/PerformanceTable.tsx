"use client";

import React from 'react';

export function PerformanceTable() {
  const users = [
    { name: 'Jane Smith', role: 'Sr. Account Exec', meetings: 42, calls: 156, emails: 430, winRate: '32%' },
    { name: 'Robert Chen', role: 'Account Exec', meetings: 38, calls: 120, emails: 310, winRate: '28%' },
    { name: 'Emily Davis', role: 'SDR', meetings: 12, calls: 450, emails: 890, winRate: '12%' },
    { name: 'Michael Brown', role: 'Account Exec', meetings: 25, calls: 90, emails: 240, winRate: '18%' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', overflowX: 'auto' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Activity Performance Matrix</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 16px', fontWeight: 600, borderRadius: '8px 0 0 8px' }}>Salesperson</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Role</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Meetings</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Calls</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Emails</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Win Rate</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {users.map((u, i) => (
            <tr key={i} style={{ borderBottom: i !== users.length -1 ? '1px solid var(--border-light)' : 'none' }}>
              <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</td>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{u.role}</td>
              <td style={{ padding: '16px', textAlign: 'center', fontWeight: 500 }}>{u.meetings}</td>
              <td style={{ padding: '16px', textAlign: 'center', fontWeight: 500 }}>{u.calls}</td>
              <td style={{ padding: '16px', textAlign: 'center', fontWeight: 500 }}>{u.emails}</td>
              <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{u.winRate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
