"use client";

import React from 'react';

export function SalesOrderHistory({ history }: { history?: any[] }) {
  const logs = history || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {logs.length === 0 && <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found.</div>}
      {logs.map((log: any) => (
        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--surface-main)' }}>
          <div>
            <div style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px' }}>{log.action}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>by {log.user?.name || 'System'} {log.description ? `- ${log.description}` : ''}</div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
