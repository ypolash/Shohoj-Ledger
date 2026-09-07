"use client";

import React, { useState } from 'react';
import styles from '../dashboard.module.css';

export function NotificationsWidget({ data }: { data?: any }) {
  const [cleared, setCleared] = useState(false);

  const rawNotifications = data?.notifications || [];
  const notifications = cleared
    ? []
    : rawNotifications.map((n: any) => ({
        id: n.id,
        text: n.message,
        time: new Date(n.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        priority: (n.priority || 'INFO').toUpperCase()
      }));

  const getPriorityStyle = (priority: string) => {
    if (priority === 'HIGH' || priority === 'URGENT') {
      return { border: '#ef4444', icon: 'error', color: '#f87171', bg: 'rgba(239, 68, 68, 0.12)' };
    }
    if (priority === 'MEDIUM' || priority === 'WARNING') {
      return { border: '#f59e0b', icon: 'warning', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)' };
    }
    return { border: '#3b82f6', icon: 'info', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.12)' };
  };

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 className={styles.panelTitle}>
            <span className="material-symbols-outlined" style={{ color: '#f87171', fontSize: '20px' }}>
              notifications_active
            </span>
            System Alerts
          </h3>
          {notifications.length > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              {notifications.length} new
            </span>
          )}
        </div>

        {notifications.length > 0 && (
          <button
            onClick={() => setCleared(true)}
            style={{
              fontSize: '12px',
              color: '#60a5fa',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Mark read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {notifications.length > 0 ? (
          notifications.map((n: any) => {
            const p = getPriorityStyle(n.priority);
            return (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 14px',
                  background: 'rgba(30, 41, 59, 0.45)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderLeft: `3px solid ${p.border}`
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: p.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: p.color }}>
                    {p.icon}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#f8fafc', lineHeight: 1.4 }}>
                    {n.text}
                  </p>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{n.time}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState} style={{ padding: '24px 12px' }}>
            <span className={`material-symbols-outlined ${styles.emptyStateIcon}`} style={{ fontSize: '32px' }}>
              notifications_off
            </span>
            <span className={styles.emptyStateText} style={{ fontSize: '12px' }}>
              No unread notifications or system alerts.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
