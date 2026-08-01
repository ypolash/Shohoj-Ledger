"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { loadAdminData, assignPermissionsAction } from '../actions';

export default function PermissionsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  
  // Local state of selected permission actions for the currently selected role
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  useEffect(() => {
    loadAdminData().then((res) => {
      setRoles(res.roles || []);
      setAllPermissions(res.permissions || []);
      if (res.roles && res.roles.length > 0) {
        handleRoleSelect(res.roles[0], res.roles);
      }
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleRoleSelect = (role: any, roleList: any[] = roles) => {
    setSelectedRoleId(role.id);
    // map the assigned RolePermission objects to just an array of action strings
    const assigned = role.permissions?.map((rp: any) => rp.permission?.action) || [];
    setSelectedActions(assigned);
  };

  const handleTogglePermission = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      await assignPermissionsAction(selectedRoleId, selectedActions);
      alert("Permissions updated successfully!");
      
      // Update local state roles
      setRoles(prev => prev.map(r => {
        if (r.id === selectedRoleId) {
          // just a mock update to avoid full reload, actual shape might differ but good enough for UI persistence
          return { ...r, permissions: selectedActions.map(action => ({ permission: { action } })) };
        }
        return r;
      }));
    } catch (err: any) {
      alert(err.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Group permissions by moduleKey
  const groupedPermissions = allPermissions.reduce((acc: any, perm: any) => {
    const key = perm.moduleKey || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(perm);
    return acc;
  }, {});

  return (
    <PageContainer>
      <PageHeader 
        title="Permissions" 
        description="Configure and manage enterprise permissions settings."
      />
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Role Permissions</h2>
            {!loading && roles.length > 0 && (
              <select 
                value={selectedRoleId} 
                onChange={(e) => {
                  const role = roles.find(r => r.id === e.target.value);
                  if (role) handleRoleSelect(role);
                }}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)', outline: 'none' }}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name} {r.isDefault ? '(Default)' : ''}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleRefresh}>
              <span className="material-symbols-outlined">refresh</span> Refresh
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading || !selectedRoleId}>
              <span className="material-symbols-outlined" style={saving ? {animation: 'spin 1s linear infinite'} : {}}>{saving ? 'autorenew' : 'save'}</span> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading permissions...</div>
        ) : !selectedRoleId ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No custom roles found. Please create a role first.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px', marginTop: '24px' }}>
            {Object.keys(groupedPermissions).map(moduleKey => (
              <div key={moduleKey} style={{ border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px', background: 'var(--surface-hover)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>
                  {moduleKey}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {groupedPermissions[moduleKey].map((perm: any) => (
                    <label key={perm.action} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedActions.includes(perm.action)}
                        onChange={() => handleTogglePermission(perm.action)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>{perm.action}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
