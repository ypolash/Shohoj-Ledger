"use client";

import React from 'react';

interface RecentActivityProps {
  role: string;
  data?: any;
}

export function RecentActivity({ role, data }: RecentActivityProps) {
  const visibleActivities = data?.recentActivities?.map((a: any) => ({
    id: a.id,
    type: a.module || 'SYSTEM',
    title: a.action,
    desc: a.description || `${a.user?.name || 'User'} performed ${a.action}`,
    time: new Date(a.createdAt).toLocaleDateString(),
    icon: 'history',
    color: 'var(--primary)'
  })) || [];

  if (visibleActivities.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', flex: 1, minWidth: '300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Recent Activity</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {visibleActivities.map((activity: any, index: number) => (
          <div key={activity.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
            {/* Vertical Line for Timeline */}
            {index !== visibleActivities.length - 1 && (
              <div style={{ 
                position: 'absolute', 
                left: '15px', 
                top: '32px', 
                bottom: '-20px', 
                width: '2px', 
                background: 'var(--border-main)',
                zIndex: 0
              }} />
            )}
            
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: `color-mix(in srgb, ${activity.color} 15%, transparent)`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              zIndex: 1,
              border: `1px solid ${activity.color}`
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: activity.color }}>
                {activity.icon}
              </span>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{activity.title}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{activity.time}</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{activity.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
