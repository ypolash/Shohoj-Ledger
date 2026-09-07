"use client";

import React from 'react';
import styles from '../dashboard.module.css';

interface RecentActivityProps {
  role: string;
  data?: any;
}

export function RecentActivity({ role, data }: RecentActivityProps) {
  const getModuleMeta = (module: string) => {
    const m = (module || 'SYSTEM').toUpperCase();
    if (m.includes('FINANCE') || m.includes('INCOME') || m.includes('EXPENSE')) {
      return { color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', icon: 'paid' };
    }
    if (m.includes('CRM') || m.includes('LEAD') || m.includes('CUSTOMER')) {
      return { color: '#38bdf8', bg: 'rgba(14, 165, 233, 0.15)', icon: 'groups' };
    }
    if (m.includes('HR') || m.includes('PAYROLL') || m.includes('STAFF')) {
      return { color: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)', icon: 'badge' };
    }
    if (m.includes('INVENTORY') || m.includes('STOCK')) {
      return { color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)', icon: 'inventory_2' };
    }
    return { color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', icon: 'history' };
  };

  const rawActivities = data?.recentActivities || [];
  const activities = rawActivities.map((a: any) => {
    const meta = getModuleMeta(a.module);
    const d = new Date(a.createdAt);
    return {
      id: a.id,
      module: a.module || 'SYSTEM',
      action: a.action,
      desc: a.description || `${a.user?.name || 'User'} performed ${a.action}`,
      time: d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      color: meta.color,
      bg: meta.bg,
      icon: meta.icon,
      userName: a.user?.name || 'Administrator'
    };
  });

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 className={styles.panelTitle}>
            <span className="material-symbols-outlined" style={{ color: '#60a5fa', fontSize: '20px' }}>
              browse_activity
            </span>
            Live Audit Activity Feed
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              padding: '2px 8px',
              borderRadius: '10px'
            }}
          >
            {activities.length} recent
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activities.length > 0 ? (
          activities.map((act: any, index: number) => (
            <div key={act.id} style={{ display: 'flex', gap: '14px', position: 'relative' }}>
              {/* Vertical connector line */}
              {index !== activities.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '17px',
                    top: '36px',
                    bottom: '-16px',
                    width: '2px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    zIndex: 0
                  }}
                />
              )}

              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: act.bg,
                  border: `1px solid ${act.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                  flexShrink: 0
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: act.color }}>
                  {act.icon}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
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
                      {act.action}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: act.bg,
                        color: act.color,
                        textTransform: 'uppercase'
                      }}
                    >
                      {act.module}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {act.time}
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  {act.desc}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState} style={{ padding: '24px 12px' }}>
            <span className={`material-symbols-outlined ${styles.emptyStateIcon}`} style={{ fontSize: '32px' }}>
              history
            </span>
            <span className={styles.emptyStateText} style={{ fontSize: '12px' }}>
              No recent audit activity logged in the system.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
