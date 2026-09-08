"use client";

import React, { useState, useEffect } from 'react';
import { loadAdminData, assignUserRoleAction, deactivateUserAction, createUserWithRoleAction, resetUserPasswordAction } from '../actions';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const AVAILABLE_ROLES = [
  { name: 'Owner', desc: 'Full financial, operational, and system command' },
  { name: 'CEO', desc: 'Executive organizational analytics and high-level vitals' },
  { name: 'Accountant', desc: 'General ledger, income, expenses, reserves, and payables' },
  { name: 'Sales', desc: 'Customer 360, leads funnel, pipeline, and sales orders' },
  { name: 'HR', desc: 'Workforce directory, daily attendance, leaves, and payroll' },
  { name: 'Inventory', desc: 'Product SKUs, stock control, warehouses, and valuation' },
  { name: 'Project Manager', desc: 'Project workspaces, milestones, and client deliverables' }
];

export default function EnterpriseCommandCenterPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit roles modal state
  const [editRoleTargetUser, setEditRoleTargetUser] = useState<UserItem | null>(null);
  const [editRolesVal, setEditRolesVal] = useState<string[]>([]);
  const [editRoleLoading, setEditRoleLoading] = useState(false);

  // New user form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRoles, setNewUserRoles] = useState<string[]>(["Accountant"]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Password reset modal state
  const [resetTargetUser, setResetTargetUser] = useState<UserItem | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await loadAdminData();
      setUsers((res.users || []).map((u: any) => ({
        id: u.id,
        name: u.name || 'Unnamed User',
        email: u.email,
        role: u.role || 'Member',
        createdAt: u.createdAt
      })));
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
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      alert('Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user? They will lose access to their role.')) return;
    setActionLoading(userId);
    try {
      await deactivateUserAction(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'inactive' } : u));
    } catch (e) {
      alert('Failed to deactivate user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      setCreateError("Name, email, and password are required.");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await createUserWithRoleAction({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRoles.join(',')
      });

      setCreateSuccess(`User created successfully! They can now log in at /login with role: ${newUserRoles.join(', ')}.`);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      await fetchData();
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess("");
      }, 2000);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user account.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newPasswordVal.trim()) return;

    setResetLoading(true);
    try {
      await resetUserPasswordAction(resetTargetUser.id, newPasswordVal);
      setResetSuccess("Password successfully updated. The user can now log in with their new password.");
      setTimeout(() => {
        setResetTargetUser(null);
        setNewPasswordVal("");
        setResetSuccess("");
      }, 2000);
    } catch (err: any) {
      alert(err.message || "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleSaveRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoleTargetUser) return;
    
    if (editRolesVal.length === 0) {
      alert("Please select at least one role.");
      return;
    }

    setEditRoleLoading(true);
    const newRolesString = editRolesVal.join(',');
    try {
      await assignUserRoleAction(editRoleTargetUser.id, newRolesString);
      setUsers(prev => prev.map(u => u.id === editRoleTargetUser.id ? { ...u, role: newRolesString } : u));
      setEditRoleTargetUser(null);
    } catch (e) {
      alert('Failed to update roles');
    } finally {
      setEditRoleLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || (u.role && u.role.toLowerCase().split(',').map((r: string) => r.trim()).includes(roleFilter.toLowerCase()));
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '24px 28px',
          background: 'var(--surface-main)',
          border: '1px solid var(--border-main)',
          borderRadius: '20px',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span className="material-symbols-outlined" style={{ color: '#60a5fa', fontSize: '22px' }}>
                shield_person
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
              Enterprise Command Center
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '700px' }}>
            Configure and provision role-based user accounts with email and password credentials. 
            Team members will log in at <code>/login</code> and automatically land in their tailored role dashboard.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            person_add
          </span>
          + Provision New User
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div
          style={{
            padding: '18px 20px',
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total User Accounts
          </span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
            {users.length}
          </span>
          <span style={{ fontSize: '11px', color: '#60a5fa' }}>All authentication records</span>
        </div>

        <div
          style={{
            padding: '18px 20px',
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Roles Configured
          </span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#34d399' }}>
            7 Roles
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Owner, CEO, Accountant, HR, Sales, Inv, PM</span>
        </div>

        <div
          style={{
            padding: '18px 20px',
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Authentication Protocol
          </span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#fbbf24' }}>
            BCrypt + JWT Session
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Direct login via Email & Password</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 20px',
          background: 'var(--surface-main)',
          border: '1px solid var(--border-main)',
          borderRadius: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '20px' }}>
            search
          </span>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              background: 'var(--surface-hover)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-main)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Roles</option>
            {AVAILABLE_ROLES.map(r => (
              <option key={r.name} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users & Roles Table */}
      <div
        style={{
          background: 'var(--surface-main)',
          border: '1px solid var(--border-main)',
          borderRadius: '20px',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-main)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>User Profile</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Email Address</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Assigned Role Persona</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading user records...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isOwner = (u.role || '').toLowerCase().split(',').map((r: string) => r.trim()).includes('owner');
                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--border-main)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Name & Avatar */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: 'rgba(59, 130, 246, 0.2)',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                              color: '#60a5fa',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '13px'
                            }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              User ID: {u.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                        <code>{u.email}</code>
                      </td>

                      {/* Role Badges */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {u.role === 'inactive' ? (
                            <span style={{ fontSize: '11px', color: '#f87171' }}>Inactive</span>
                          ) : (
                            (u.role || 'Member').split(',').map((r: string) => (
                              <span key={r} style={{
                                padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                                background: 'var(--surface-hover)', color: r.trim().toLowerCase() === 'owner' ? '#fbbf24' : '#60a5fa', border: '1px solid var(--border-main)'
                              }}>
                                {r.trim()}
                              </span>
                            ))
                          )}
                          <button
                            onClick={() => {
                              setEditRoleTargetUser(u);
                              setEditRolesVal(u.role === 'inactive' ? [] : (u.role || '').split(',').map((r: string)=>r.trim()));
                            }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            title="Edit Roles"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: u.role === 'inactive' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: u.role === 'inactive' ? '#f87171' : '#34d399',
                            border: `1px solid ${u.role === 'inactive' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                          }}
                        >
                          {u.role === 'inactive' ? 'Inactive' : 'Active Credential'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setResetTargetUser(u);
                              setNewPasswordVal("");
                            }}
                            title="Reset Password"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-main)',
                              background: 'var(--surface-hover)',
                              color: 'var(--text-secondary)',
                              fontSize: '11px',
                              fontWeight: 500,
                              cursor: 'pointer'
                            }}
                          >
                            Reset Password
                          </button>
                          {u.role !== 'inactive' && !isOwner && (
                            <button
                              onClick={() => handleDeactivate(u.id)}
                              title="Deactivate User"
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#f87171',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer'
                              }}
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No users matching criteria found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Workspace Matrix Reference */}
      <div
        style={{
          padding: '24px',
          background: 'var(--surface-main)',
          border: '1px solid var(--border-main)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: '#60a5fa', fontSize: '20px' }}>
            schema
          </span>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
            Role-Based Workspace Matrix
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          When team members log in, the Enterprise Dashboard automatically adapts to their assigned role persona:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {AVAILABLE_ROLES.map((r) => (
            <div
              key={r.name}
              style={{
                padding: '12px 14px',
                background: 'var(--surface-hover)',
                border: '1px solid var(--border-main)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {r.name}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa'
                  }}
                >
                  Active Workspace
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Provision New User */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'var(--surface-main)',
              border: '1px solid var(--border-main)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: '#60a5fa', fontSize: '20px' }}>
                    person_add
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Provision User with Role
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Create an account with email & password. The user will be able to log in at <code>/login</code> and immediately perform their role.
            </p>

            {createError && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  color: '#f87171',
                  fontSize: '12px'
                }}
              >
                {createError}
              </div>
            )}

            {createSuccess && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  color: '#34d399',
                  fontSize: '12px'
                }}
              >
                {createSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Accountant"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--surface-main)',
                    border: '1px solid var(--border-main)',
                    borderRadius: '10px',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@shohojledger.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--surface-main)',
                    border: '1px solid var(--border-main)',
                    borderRadius: '10px',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Login Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Set account password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--surface-main)',
                    border: '1px solid var(--border-main)',
                    borderRadius: '10px',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Assigned Role Personas
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', background: 'var(--surface-main)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-main)' }}>
                  {AVAILABLE_ROLES.map(r => (
                    <label key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={newUserRoles.includes(r.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUserRoles(prev => [...prev, r.name]);
                          } else {
                            setNewUserRoles(prev => prev.filter(role => role !== r.name));
                          }
                        }}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>{r.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>— {r.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-main)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  {createLoading ? 'Provisioning...' : 'Provision User & Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetTargetUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'var(--surface-main)',
              border: '1px solid var(--border-main)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                Reset Password
              </h3>
              <button
                onClick={() => setResetTargetUser(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Set a new login password for <strong>{resetTargetUser.name}</strong> (<code>{resetTargetUser.email}</code>).
            </p>

            {resetSuccess && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  color: '#34d399',
                  fontSize: '12px'
                }}
              >
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--surface-main)',
                    border: '1px solid var(--border-main)',
                    borderRadius: '10px',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={resetLoading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {resetLoading ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

