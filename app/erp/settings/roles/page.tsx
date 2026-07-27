"use client";

import React, { useState, useEffect } from 'react';
import { loadAdminData, createRoleAction, deleteRoleAction } from '../actions';

export default function RolesSettingsPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await loadAdminData();
      setRoles(res.roles || []);
      setUsers(res.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await createRoleAction(newRoleName);
      setNewRoleName("");
      setShowModal(false);
      fetchData(); // Reload roles
    } catch (e: any) {
      setError(e.message || "Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    const assignedCount = users.filter(u => u.role === roleName).length;
    if (assignedCount > 0) {
      alert(`Cannot delete role '${roleName}' because it is assigned to ${assignedCount} active user(s).`);
      return;
    }
    
    if (!confirm(`Are you sure you want to delete the role '${roleName}'?`)) return;
    
    try {
      await deleteRoleAction(roleId);
      setRoles(roles.filter(r => r.id !== roleId));
    } catch (e) {
      alert("Failed to delete role.");
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Roles & Hierarchy</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Define custom enterprise roles and manage their assignment counts.
          </p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => { setShowModal(true); setError(""); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Create Role
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Role Name</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Type</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Configured Permissions</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Assigned Users</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                    <td colSpan={5} style={{ padding: '16px' }}><div style={{ height: '16px', background: 'var(--surface-hover)', borderRadius: '6px' }} /></td>
                  </tr>
                ))
              ) : (
                <>
                  {/* System Roles - Hardcoded display for context */}
                  <tr style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--surface-bg)' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>owner</td>
                    <td style={{ padding: '16px' }}><span style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '11px', fontWeight: 700 }}>SYSTEM</span></td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>Full Access (Bypasses RBAC)</td>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{users.filter(u => u.role === 'owner').length} Users</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>Immutable</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--surface-bg)' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>admin</td>
                    <td style={{ padding: '16px' }}><span style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '11px', fontWeight: 700 }}>SYSTEM</span></td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>Full Access (Bypasses RBAC)</td>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{users.filter(u => u.role === 'admin').length} Users</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>Immutable</td>
                  </tr>

                  {/* Custom Roles */}
                  {roles.map(role => {
                    const assigned = users.filter(u => u.role === role.name).length;
                    return (
                      <tr key={role.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                        <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{role.name}</td>
                        <td style={{ padding: '16px' }}><span style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--primary-subtle)', color: 'var(--primary)', fontSize: '11px', fontWeight: 700 }}>CUSTOM</span></td>
                        <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                          {role.permissions?.length || 0} permissions linked
                        </td>
                        <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{assigned} Users</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button className="btn btn-secondary" onClick={() => handleDeleteRole(role.id, role.name)} title="Delete Role" style={{ padding: '6px 10px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--danger)' }}>delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Role Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '32px', margin: '16px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: 'var(--text-main)' }}>Create Custom Role</h2>
            
            {error && <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '13px' }}>⚠ {error}</div>}

            <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Role Identifier Name *</label>
                <input 
                  type="text" 
                  value={newRoleName} 
                  onChange={e => setNewRoleName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} 
                  required 
                  placeholder="e.g. hr_manager" 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }} 
                />
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Lowercase, numbers, underscores, and dashes only.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !newRoleName}>{saving ? 'Creating...' : 'Create Role'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
