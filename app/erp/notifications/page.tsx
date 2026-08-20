"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default function NotificationsInboxPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/erp/notifications?limit=50&filter=all');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <PageContainer>
      <PageHeader 
        title="Notifications Inbox" 
        description="View and manage all your enterprise alerts and notifications."
      />
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>All Notifications</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={fetchNotifications} disabled={loading}>
              <span className="material-symbols-outlined" style={loading ? {animation: 'spin 1s linear infinite'} : {}}>refresh</span> Refresh
            </button>
            <button className="btn btn-primary" onClick={() => window.location.href = '/erp/settings/notifications'}>
              <span className="material-symbols-outlined">settings</span> Settings
            </button>
          </div>
        </div>
        
        {loading ? (
          <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5, marginBottom: '16px' }}>notifications_off</span>
            <p style={{ margin: 0, fontSize: '16px' }}>You have no notifications.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                style={{
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: notif.status === 'UNREAD' ? 'var(--surface-hover)' : 'transparent',
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  gap: 'var(--spacing-4)',
                  alignItems: 'flex-start',
                  transition: 'background-color var(--transition-fast)'
                }}
              >
                <div style={{
                  minWidth: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: notif.status === 'UNREAD' ? 'var(--primary-glow)' : 'var(--surface-hover)',
                  color: notif.status === 'UNREAD' ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span className="material-symbols-outlined">
                    {notif.priority === 'HIGH' ? 'priority_high' : 'notifications'}
                  </span>
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '15px', 
                      fontWeight: notif.status === 'UNREAD' ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                      color: 'var(--text-main)'
                    }}>
                      {notif.title}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {notif.message}
                  </p>
                </div>
                
                {notif.status === 'UNREAD' && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', marginTop: '6px' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
