"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default function NotificationsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastModified, setLastModified] = useState<string>("Never");
  
  const [prefs, setPrefs] = useState({
    emailEnabled: true,
    inAppEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
  });

  const fetchPrefs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/erp/settings/notifications');
      const data = await res.json();
      if (data.success && data.data) {
        setPrefs({
          emailEnabled: data.data.emailEnabled,
          inAppEnabled: data.data.inAppEnabled,
          smsEnabled: data.data.smsEnabled,
          pushEnabled: data.data.pushEnabled,
        });
        setLastModified(new Date(data.data.updatedAt).toLocaleString());
      }
    } catch (error) {
      console.error("Failed to load notification settings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, []);

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/erp/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      });
      const data = await res.json();
      
      if (data.success) {
        setLastModified(new Date(data.data.updatedAt).toLocaleString());
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("An error occurred while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    fetchPrefs();
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Notifications" 
        description="Configure and manage enterprise notifications settings."
      />
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Notifications Configuration</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleRefresh} disabled={loading}>
              <span className="material-symbols-outlined" style={loading ? {animation: 'spin 1s linear infinite'} : {}}>refresh</span> Refresh
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
              <span className="material-symbols-outlined" style={saving ? {animation: 'spin 1s linear infinite'} : {}}>{saving ? 'autorenew' : 'save'}</span> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Description</th>
                <th>Status</th>
                <th>Last Modified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                    Loading preferences...
                  </td>
                </tr>
              ) : (
                <>
                  <NotificationRow 
                    channel="Email Notifications" 
                    description="Receive important alerts and digests via email."
                    enabled={prefs.emailEnabled}
                    lastModified={lastModified}
                    onToggle={() => handleToggle('emailEnabled')}
                  />
                  <NotificationRow 
                    channel="In-App Notifications" 
                    description="Receive alerts within the ERP dashboard."
                    enabled={prefs.inAppEnabled}
                    lastModified={lastModified}
                    onToggle={() => handleToggle('inAppEnabled')}
                  />
                  <NotificationRow 
                    channel="SMS Notifications" 
                    description="Receive critical alerts directly to your mobile device."
                    enabled={prefs.smsEnabled}
                    lastModified={lastModified}
                    onToggle={() => handleToggle('smsEnabled')}
                  />
                  <NotificationRow 
                    channel="Push Notifications" 
                    description="Receive browser push notifications for real-time events."
                    enabled={prefs.pushEnabled}
                    lastModified={lastModified}
                    onToggle={() => handleToggle('pushEnabled')}
                  />
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}

function NotificationRow({ 
  channel, 
  description, 
  enabled, 
  lastModified,
  onToggle 
}: { 
  channel: string; 
  description: string; 
  enabled: boolean; 
  lastModified: string;
  onToggle: () => void;
}) {
  return (
    <tr>
      <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{channel}</td>
      <td style={{ color: 'var(--text-muted)' }}>{description}</td>
      <td>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-medium)',
          backgroundColor: enabled ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: enabled ? 'var(--success-text)' : 'var(--danger-text)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            {enabled ? 'check_circle' : 'cancel'}
          </span>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </td>
      <td style={{ color: 'var(--text-muted)' }}>{lastModified}</td>
      <td style={{ textAlign: 'right' }}>
        <button 
          onClick={onToggle}
          style={{
            backgroundColor: enabled ? 'var(--success)' : 'var(--surface-hover)',
            border: enabled ? 'none' : '1px solid var(--border-main)',
            borderRadius: 'var(--radius-full)',
            width: '44px',
            height: '24px',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '2px',
            left: enabled ? '22px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all var(--transition-fast)'
          }} />
        </button>
      </td>
    </tr>
  );
}
