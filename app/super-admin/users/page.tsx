"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { 
  Users, 
  Search, 
  RefreshCw, 
  KeyRound, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Mail,
  ShieldAlert
} from 'lucide-react';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  platformRole: string | null;
  companyId: string | null;
  createdAt: string;
  company?: {
    id: string;
    name: string;
    businessType: string;
    status: string;
  } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [metrics, setMetrics] = useState({
    totalTenantUsers: 0,
    totalCompanies: 0,
    verifiedCount: 0,
    unverifiedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeUser, setActiveUser] = useState<UserRecord | null>(null);

  // Form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: '',
    companyId: '',
    emailVerified: false,
    newPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCompany) params.append('companyId', selectedCompany);

      const res = await fetch(`/api/system/users?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = '/super-admin/login';
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch users');
      }
      const data = await res.json();
      // Ensure Super Admin account is never displayed in tenant users list
      const tenantUsers = (data.users || []).filter(
        (u: UserRecord) => u.platformRole !== 'SUPER_ADMIN' && u.email !== 'team@shohoj.com'
      );
      setUsers(tenantUsers);
      setCompanies(data.companies || []);
      if (data.metrics) setMetrics(data.metrics);
    } catch (err: any) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, selectedCompany]);

  const openEditModal = (user: UserRecord) => {
    setActiveUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role || 'Member',
      companyId: user.companyId || '',
      emailVerified: user.emailVerified,
      newPassword: '',
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/system/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser.id,
          ...editFormData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      showToast(`User ${editFormData.name} updated successfully!`, 'success');
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!activeUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/system/users?userId=${activeUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      showToast(`User ${activeUser.name} deleted successfully!`, 'success');
      setShowDeleteModal(false);
      setActiveUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (statusFilter === 'VERIFIED' && !u.emailVerified) return false;
    if (statusFilter === 'UNVERIFIED' && u.emailVerified) return false;
    return true;
  });

  return (
    <PageContainer>
      <PageHeader 
        title="Registered Tenant Users" 
        description="Manage all tenant accounts, reset passwords, update assigned organizations, and review verification statuses."
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#fff',
          backgroundColor: toastMessage.type === 'success' ? '#10b981' : '#ef4444',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{toastMessage.text}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Tenant Users</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>{metrics.totalTenantUsers}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Registered Companies</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>{metrics.totalCompanies}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verified Accounts</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#34d399' }}>{metrics.verifiedCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Pending Verification</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f87171' }}>{metrics.unverifiedCount}</div>
          </div>
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        {/* Controls Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1 }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '360px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-main)',
                  background: 'var(--surface-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                }}
              />
            </div>

            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-main)',
                background: 'var(--surface-subtle)',
                color: 'var(--text-main)',
                fontSize: '14px',
              }}
            >
              <option value="">All Companies / Tenants</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-main)',
                background: 'var(--surface-subtle)',
                color: 'var(--text-main)',
                fontSize: '14px',
              }}
            >
              <option value="">All Verification Statuses</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="UNVERIFIED">Unverified Only</option>
            </select>

            <button
              className="btn btn-secondary"
              onClick={fetchUsers}
              title="Refresh users"
              style={{ padding: '9px 14px' }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>User / Contact</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Company / Tenant</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tenant Role</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Registered</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                    <p style={{ margin: 0 }}>Loading tenant users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <Users size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No tenant users found.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initials = u.name ? u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      {/* Name / Email */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'var(--surface-hover)',
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px',
                            border: '1px solid var(--border-main)',
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={11} /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                        {u.company ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{u.company.name}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12px' }}>No Tenant Assigned</span>
                        )}
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'var(--surface-hover)',
                          color: 'var(--text-main)',
                          fontWeight: 500,
                        }}>
                          {u.role || 'Member'}
                        </span>
                      </td>

                      {/* Verification Status */}
                      <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                        {u.emailVerified ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '12px', fontWeight: 500 }}>
                            <CheckCircle2 size={14} /> Verified
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '12px', fontWeight: 500 }}>
                            <XCircle size={14} /> Unverified
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* Edit / Password Reset */}
                          <button
                            onClick={() => openEditModal(u)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Edit user details or reset password"
                          >
                            <Edit3 size={14} /> Edit / Password
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              setActiveUser(u);
                              setShowDeleteModal(true);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '6px 8px', fontSize: '12px', color: '#ef4444' }}
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT USER & PASSWORD RESET MODAL */}
      {showEditModal && activeUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '28px', position: 'relative', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700 }}>Edit Tenant User</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Update profile details, assign company, or reset password for {activeUser.name}.
            </p>

            <form onSubmit={handleUpdateUser}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Full Name</label>
                <input
                  required
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Email Address</label>
                <input
                  required
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Company / Tenant</label>
                  <select
                    value={editFormData.companyId}
                    onChange={(e) => setEditFormData({ ...editFormData, companyId: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '14px' }}
                  >
                    <option value="">No Company</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Tenant Role</label>
                  <input
                    type="text"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={editFormData.emailVerified}
                    onChange={(e) => setEditFormData({ ...editFormData, emailVerified: e.target.checked })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Mark Email as Verified
                </label>
              </div>

              {/* Password Reset Box */}
              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px dashed rgba(239, 68, 68, 0.3)', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#f87171' }}>
                  <KeyRound size={15} /> Reset Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Enter new password to reset"
                  value={editFormData.newPassword}
                  onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && activeUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '28px', position: 'relative', borderRadius: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: '16px' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>Delete Tenant User?</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete <strong>{activeUser.name}</strong> ({activeUser.email})? This will immediately revoke their tenant access.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteUser} 
                className="btn btn-primary" 
                style={{ background: '#ef4444', borderColor: '#ef4444' }} 
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
