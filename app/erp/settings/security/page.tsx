"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { loadAdminData, updateSettings } from '../actions';

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
    shiftStartTime: '09:00',
    shiftEndTime: '18:00',
    gracePeriodMinutes: 15
  });

  useEffect(() => {
    loadAdminData().then((res) => {
      if (res.company?.settings) {
        setSettings({
          currency: res.company.settings.currency || 'BDT',
          timezone: res.company.settings.timezone || 'Asia/Dhaka',
          shiftStartTime: res.company.settings.shiftStartTime || '09:00',
          shiftEndTime: res.company.settings.shiftEndTime || '18:00',
          gracePeriodMinutes: res.company.settings.gracePeriodMinutes || 15
        });
      }
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleChange = (field: string, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      alert("Settings saved successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <PageContainer>
      <PageHeader 
        title="System & Operational Settings" 
        description="Configure timezones, currency, and operational shift rules."
      />
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Global Settings</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleRefresh}>
              <span className="material-symbols-outlined">refresh</span> Refresh
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
              <span className="material-symbols-outlined" style={saving ? {animation: 'spin 1s linear infinite'} : {}}>{saving ? 'autorenew' : 'save'}</span> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading system settings...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Default Currency</label>
              <select 
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)' }}
              >
                <option value="BDT">BDT - Bangladeshi Taka (৳)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>System Timezone</label>
              <select 
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)' }}
              >
                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Shift Start Time</label>
              <input 
                type="time" 
                value={settings.shiftStartTime}
                onChange={(e) => handleChange('shiftStartTime', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Shift End Time</label>
              <input 
                type="time" 
                value={settings.shiftEndTime}
                onChange={(e) => handleChange('shiftEndTime', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Grace Period (Minutes)</label>
              <input 
                type="number" 
                value={settings.gracePeriodMinutes}
                onChange={(e) => handleChange('gracePeriodMinutes', parseInt(e.target.value))}
                min="0"
                max="120"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)' }}
              />
            </div>
            
          </div>
        )}
      </div>
    </PageContainer>
  );
}
