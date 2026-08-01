"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { loadAdminData, updateProfile } from '../actions';

export default function BrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    loadAdminData().then((res) => {
      setCompanyName(res.company?.name || "");
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!companyName.trim()) {
      alert("Company name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: companyName });
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
        title="Branding & UI" 
        description="Configure and manage enterprise branding settings."
      />
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Company Identity</h2>
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
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading branding settings...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Company Name</label>
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)' }}
                placeholder="Enter your legal company name"
              />
            </div>
            
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Company Logo (Coming Soon)</label>
              <div style={{ width: '100px', height: '100px', borderRadius: '12px', border: '2px dashed var(--border-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'var(--surface-hover)', cursor: 'not-allowed' }}>
                <span className="material-symbols-outlined">image</span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Image upload will be supported in a future update.</p>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
