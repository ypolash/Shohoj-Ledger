"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { loadAdminData, toggleModuleAction } from '../actions';

export default function ModulesPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    loadAdminData().then((res) => {
      setModules(res.modules || []);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleToggle = async (companyModuleId: string, moduleId: string, currentStatus: boolean) => {
    setSavingId(moduleId);
    try {
      await toggleModuleAction(moduleId, !currentStatus);
      // update local state
      setModules(prev => prev.map(m => m.id === companyModuleId ? { ...m, isActive: !currentStatus } : m));
    } catch (err: any) {
      alert(err.message || "Failed to toggle module");
    } finally {
      setSavingId(null);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Enterprise Modules" 
        description="Enable or disable core ERP features and modules for your organization."
      />
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Module Configuration</h2>
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <span className="material-symbols-outlined">refresh</span> Refresh
          </button>
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading modules...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {modules.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>No modules found for your company.</div>
            ) : (
              modules.map((cm) => (
                <div key={cm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-main)', background: 'var(--surface-hover)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>{cm.module.name}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{cm.module.description}</p>
                    <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: cm.isActive ? 'var(--success-10)' : 'var(--danger-10)', color: cm.isActive ? 'var(--success)' : 'var(--danger)', width: 'fit-content', fontWeight: 600 }}>
                      {cm.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleToggle(cm.id, cm.module.id, cm.isActive)}
                    disabled={savingId === cm.module.id}
                    style={{ 
                      background: cm.isActive ? 'var(--danger)' : 'var(--success)', 
                      color: '#fff', 
                      border: 'none', 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      cursor: savingId === cm.module.id ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      opacity: savingId === cm.module.id ? 0.7 : 1
                    }}
                  >
                    {savingId === cm.module.id ? 'Saving...' : cm.isActive ? 'Disable' : 'Enable'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
