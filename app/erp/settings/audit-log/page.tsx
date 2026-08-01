"use client";

import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default function AuditLogPage() {
  

  
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully!");
    }, 800);
  };

  const handleRefresh = () => {
    window.location.reload();
  };
return (
    <PageContainer>
      <PageHeader 
        title="Audit Log" 
        description="Configure and manage enterprise audit log settings."
      />
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Audit Log Configuration</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleRefresh}>
              <span className="material-symbols-outlined">refresh</span> Refresh
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <span className="material-symbols-outlined" style={saving ? {animation: 'spin 1s linear infinite'} : {}}>{saving ? 'autorenew' : 'save'}</span> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Setting Key</th>
                <th>Configuration Value</th>
                <th>Status</th>
                <th>Last Modified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>settings_applications</span>
                    <p style={{ margin: 0 }}>No audit log configurations found.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
