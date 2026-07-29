"use client";

import React from 'react';

export function NotificationsWidget({ data }: { data?: any }) {
  const notifications = data?.notifications?.map((n: any) => ({
    id: n.id,
    text: n.message,
    time: new Date(n.createdAt).toLocaleDateString(),
    priority: n.priority?.toLowerCase() || 'low'
  })) || [];

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', flex: 1, minWidth: '300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          Notifications
          <span style={{ background: 'var(--danger)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{notifications.length}</span>
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>Mark all read</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifications.map((n: any) => (
          <div key={n.id} style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            background: 'var(--surface-hover)',
            borderLeft: `3px solid ${n.priority === 'high' ? 'var(--danger)' : n.priority === 'medium' ? 'var(--warning)' : 'var(--info)'}`
          }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-main)' }}>{n.text}</p>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
