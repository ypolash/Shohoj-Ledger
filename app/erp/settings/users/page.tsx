"use client";

import React, { useState, useEffect } from 'react';
import { loadAdminData, assignUserRoleAction, deactivateUserAction } from '../actions';

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await loadAdminData();
      setUsers(res.users || []);
      setRoles(res.roles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await assignUserRoleAction(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      alert('Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user? They will lose access.')) return;
    setActionLoading(userId);
    try {
      await deactivateUserAction(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, role: 'inactive' } : u));
    } catch (e) {
      alert('Failed to deactivate user');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>User Management</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Manage staff access, roles, and system authentication states.
          </p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => alert('Add User functionality via email invite coming soon.')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
          Invite User
        </button>
      </div>

      {/* Filter */}
      <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'var(--text-muted)' }}>search</span>
          <input type="text" placeholder="Search users by name or email..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>User</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Email</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>System Role</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Status</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                    <td colSpan={5} style={{ padding: '16px' }}><div style={{ height: '16px', background: 'var(--surface-hover)', borderRadius: '6px' }} /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.3, display: 'block', marginBottom: '8px' }}>group_off</span>
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name || 'Unnamed User'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td style={{ padding: '16px' }}>
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={actionLoading === user.id}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                      >
                        {/* Always include native roles */}
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="user">Standard User</option>
                        <option value="inactive">Inactive</option>
                        {/* Include custom dynamic roles */}
                        {roles.map(r => (
                          <option key={r.id} value={r.name}>{r.name} (Custom)</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {user.role === 'inactive' ? (
                        <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '12px', fontWeight: 700 }}>Inactive</span>
                      ) : (
                        <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'var(--success-subtle)', color: 'var(--success)', fontSize: '12px', fontWeight: 700 }}>Active</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {actionLoading === user.id ? (
                        <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }}>autorenew</span>
                      ) : (
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleDeactivate(user.id)}
                          disabled={user.role === 'owner' || user.role === 'inactive'}
                          title={user.role === 'owner' ? "Cannot deactivate owner" : "Deactivate user"}
                          style={{ padding: '6px 10px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: user.role === 'owner' ? 'var(--text-muted)' : 'var(--danger)' }}>block</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
