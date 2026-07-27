"use client";

import React, { useState, useEffect } from 'react';
import { loadAdminData, updateProfile, updateSettings } from '../actions';

export default function CompanySettingsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
    shiftStartTime: '09:00',
    shiftEndTime: '17:00',
    gracePeriodMinutes: '15'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await loadAdminData();
      setData(res.company);
      if (res.company) {
        setForm({
          name: res.company.name || '',
          currency: res.company.settings?.currency || 'BDT',
          timezone: res.company.settings?.timezone || 'Asia/Dhaka',
          shiftStartTime: res.company.settings?.shiftStartTime || '09:00',
          shiftEndTime: res.company.settings?.shiftEndTime || '17:00',
          gracePeriodMinutes: String(res.company.settings?.gracePeriodMinutes || 15)
        });
      }
    } catch (e) { console.error(e); setError('Failed to load settings'); }
    finally { setIsLoading(false); }
  };

  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await updateProfile({ name: form.name });
      await updateSettings({
        currency: form.currency,
        timezone: form.timezone,
        shiftStartTime: form.shiftStartTime,
        shiftEndTime: form.shiftEndTime,
        gracePeriodMinutes: form.gracePeriodMinutes
      });
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="animate-fade-in" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)', maxWidth: '800px' }}>
      <div>
        <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Company Profile & Global Settings</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
          Manage your organization's core details and system-wide localization defaults.
        </p>
      </div>

      {error && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid var(--danger)', fontSize: '14px' }}>⚠ {error}</div>}
      {success && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>✓ {success}</div>}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Core Profile */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 20px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-main)', paddingBottom: '12px' }}>Organization Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div>
              <label style={ls}>Company Name *</label>
              <input type="text" value={form.name} onChange={e => handleForm('name', e.target.value)} required style={is} placeholder="e.g. Acme Corporation" />
            </div>
            {/* Add more fields here as schema expands, like address, tax id, etc. */}
          </div>
        </div>

        {/* Localization & Time */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 20px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-main)', paddingBottom: '12px' }}>Localization & Time Settings</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={ls}>Base Currency</label>
              <select value={form.currency} onChange={e => handleForm('currency', e.target.value)} style={is}>
                <option value="BDT">BDT - Bangladeshi Taka</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            <div>
              <label style={ls}>Timezone</label>
              <select value={form.timezone} onChange={e => handleForm('timezone', e.target.value)} style={is}>
                <option value="Asia/Dhaka">Asia/Dhaka</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Default HR Settings */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 20px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-main)', paddingBottom: '12px' }}>Global HR / Attendance Defaults</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={ls}>Default Shift Start</label>
              <input type="time" value={form.shiftStartTime} onChange={e => handleForm('shiftStartTime', e.target.value)} style={is} />
            </div>
            <div>
              <label style={ls}>Default Shift End</label>
              <input type="time" value={form.shiftEndTime} onChange={e => handleForm('shiftEndTime', e.target.value)} style={is} />
            </div>
            <div>
              <label style={ls}>Grace Period (Mins)</label>
              <input type="number" value={form.gracePeriodMinutes} onChange={e => handleForm('gracePeriodMinutes', e.target.value)} style={is} min="0" />
            </div>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>These defaults apply when a specific shift is not assigned to an employee.</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary hover-lift" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '15px' }}>
            <span className="material-symbols-outlined">{saving ? 'autorenew' : 'save'}</span>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

const ls: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' };
const is: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
