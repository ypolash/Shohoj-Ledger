"use client";

import React from 'react';

interface RecentActivityProps {
  role: string;
}

export function RecentActivity({ role }: RecentActivityProps) {
  const allActivities = [
    { id: 1, type: 'FINANCE', title: 'Invoice Paid', desc: 'INV-2026-001 was paid by ACME Corp.', time: '10 mins ago', icon: 'payments', color: 'var(--success)', roles: ['Owner', 'CEO', 'Accountant'] },
    { id: 2, type: 'HR', title: 'Leave Approved', desc: 'John Doe\'s annual leave was approved.', time: '1 hour ago', icon: 'event_available', color: 'var(--info)', roles: ['Owner', 'HR'] },
    { id: 3, type: 'CRM', title: 'New Lead', desc: 'Sarah Smith signed up for a demo.', time: '2 hours ago', icon: 'person_add', color: 'var(--primary)', roles: ['Owner', 'Sales'] },
    { id: 4, type: 'INVENTORY', title: 'Stock Alert', desc: 'Product A is below minimum threshold.', time: '3 hours ago', icon: 'warning', color: 'var(--warning)', roles: ['Owner', 'Inventory'] },
    { id: 5, type: 'SYSTEM', title: 'Backup Completed', desc: 'Daily database backup completed successfully.', time: '5 hours ago', icon: 'cloud_done', color: 'var(--gray-500)', roles: ['Owner'] },
  ];

  const visibleActivities = allActivities.filter(a => a.roles.includes(role));

  if (visibleActivities.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', flex: 1, minWidth: '300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Recent Activity</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {visibleActivities.map((activity, index) => (
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
