"use client";

import React from 'react';
import styles from '../dashboard.module.css';

export function CalendarWidget({ data }: { data?: any }) {
  const events = data?.calendarEvents?.map((e: any) => {
    const d = new Date(e.date);
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
    const dateStr = d.getDate().toString();
    return {
      date: dateStr,
      month: monthStr,
      day: dayStr,
      title: e.name,
      type: e.type || 'Holiday'
    };
  }) || [];

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 className={styles.panelTitle}>
            <span className="material-symbols-outlined" style={{ color: '#818cf8', fontSize: '20px' }}>
              calendar_month
            </span>
            Upcoming Events & Holidays
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              padding: '2px 8px',
              borderRadius: '10px'
            }}
          >
            {events.length}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {events.length > 0 ? (
          events.map((e: any, idx: number) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                padding: '10px 12px',
                background: 'rgba(30, 41, 59, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '10px',
                  width: '44px',
                  height: '44px',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '9px', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase' }}>
                  {e.month}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>
                  {e.date}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#f8fafc',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {e.title}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {e.type} • {e.day}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState} style={{ padding: '24px 12px' }}>
            <span className={`material-symbols-outlined ${styles.emptyStateIcon}`} style={{ fontSize: '32px' }}>
              event_available
            </span>
            <span className={styles.emptyStateText} style={{ fontSize: '12px' }}>
              No upcoming company holidays scheduled for this month.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
