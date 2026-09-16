"use client";

import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Plus,
  Filter,
  X,
  Lock,
  UserCheck,
  Sparkles
} from 'lucide-react';
import styles from './users.module.css';

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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');

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
    <div className={styles.pageContainer}>
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={styles.toast}
          style={{ backgroundColor: toastMessage.type === 'success' ? '#10b981' : '#ef4444' }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Executive Mission Control Header */}
      <section className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <div className={styles.livePulseDot} />
            <span className={styles.liveBadgeText}>Master User Directory Online</span>
          </div>
          <h1 className={styles.pageTitle}>
            <Users size={26} style={{ color: '#60a5fa' }} />
            Registered Tenant Users
          </h1>
          <p className={styles.pageSubtitle}>
            Global tenant identity directory: audit multi-tenant accounts, reset credentials, assign organization affiliations, and monitor verification states.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            type="button" 
            onClick={fetchUsers} 
            disabled={loading}
            className={styles.refreshBtn}
            title="Refresh Directory"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Directory'}</span>
          </button>
        </div>
      </section>

      {/* 2. KPI Metric Cards Grid */}
      <section className={styles.kpiGrid}>
        {/* Total Tenant Users */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Users size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              Total Accounts
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Tenant Users</span>
            <span className={styles.kpiValue}>{metrics.totalTenantUsers}</span>
          </div>
        </div>

        {/* Registered Companies */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Building2 size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              Tenant Companies
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Registered Companies</span>
            <span className={styles.kpiValue} style={{ color: '#fbbf24' }}>{metrics.totalCompanies}</span>
          </div>
        </div>

        {/* Verified Accounts */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCircle2 size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              Compliant
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Verified Accounts</span>
            <span className={styles.kpiValue} style={{ color: '#34d399' }}>{metrics.verifiedCount}</span>
          </div>
        </div>

        {/* Pending Verification */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <ShieldAlert size={24} />
            </div>
            <span 
              className={styles.kpiBadge} 
              style={{ 
                background: metrics.unverifiedCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.15)', 
                color: metrics.unverifiedCount > 0 ? '#f87171' : '#94a3b8' 
              }}
            >
              {metrics.unverifiedCount > 0 ? 'Action Needed' : 'All Clear'}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Pending Verification</span>
            <span className={styles.kpiValue} style={{ color: metrics.unverifiedCount > 0 ? '#f87171' : '#ffffff' }}>
              {metrics.unverifiedCount}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Main Data Card with Filter Tabs and Controls */}
      <section className={styles.mainCard}>
        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.controlsLeft}>
            {/* Search Input */}
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button 
                  type="button" 
                  onClick={() => setSearchTerm('')} 
                  className={styles.clearSearchBtn}
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Company / Tenant Filter */}
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Companies / Tenants ({companies.length})</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className={styles.filterTabsRow}>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`${styles.filterTabBtn} ${statusFilter === 'ALL' ? styles.filterTabBtnActive : ''}`}
          >
            <Users size={14} />
            <span>All Users ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('VERIFIED')}
            className={`${styles.filterTabBtn} ${statusFilter === 'VERIFIED' ? styles.filterTabBtnActive : ''}`}
          >
            <CheckCircle2 size={14} />
            <span>Verified Accounts ({metrics.verifiedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('UNVERIFIED')}
            className={`${styles.filterTabBtn} ${statusFilter === 'UNVERIFIED' ? styles.filterTabBtnActive : ''}`}
          >
            <XCircle size={14} />
            <span>Unverified Accounts ({metrics.unverifiedCount})</span>
          </button>
        </div>

        {/* Users Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User / Contact</th>
                <th>Company / Tenant</th>
                <th>Tenant Role</th>
                <th>Status</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
                    <RefreshCw size={24} className={styles.spinning} style={{ margin: '0 auto 12px', color: '#60a5fa' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>Loading tenant users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyBox}>
                      <Users size={44} style={{ opacity: 0.3 }} />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '15px', color: '#cbd5e1' }}>No tenant users found</p>
                      <span style={{ fontSize: '13px' }}>Try adjusting your search query or company filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initials = u.name 
                    ? u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) 
                    : (u.email ? u.email.slice(0, 2).toUpperCase() : 'U');

                  const normalizedRole = (u.role || 'Member').toUpperCase();
                  const roleClass = normalizedRole.includes('OWNER') 
                    ? styles.roleOwner 
                    : normalizedRole.includes('ADMIN') 
                    ? styles.roleAdmin 
                    : styles.roleMember;

                  return (
                    <tr key={u.id} className={styles.tableRow}>
                      {/* Name / Email */}
                      <td>
                        <div className={styles.userInfoBox}>
                          <div className={styles.avatarCircle}>
                            {initials}
                          </div>
                          <div>
                            <div className={styles.userName}>
                              {u.name || 'Unnamed User'}
                            </div>
                            <div className={styles.userEmail}>
                              <Mail size={12} style={{ color: '#64748b' }} /> 
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company / Tenant */}
                      <td>
                        {u.company ? (
                          <div className={styles.companyBadge}>
                            <Building2 size={14} style={{ color: '#60a5fa' }} />
                            <span>{u.company.name}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '12px' }}>
                            No Tenant Assigned
                          </span>
                        )}
                      </td>

                      {/* Role */}
                      <td>
                        <span className={`${styles.roleTag} ${roleClass}`}>
                          {u.role || 'Member'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        {u.emailVerified ? (
                          <span className={styles.statusVerified}>
                            <CheckCircle2 size={13} />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className={styles.statusUnverified}>
                            <XCircle size={13} />
                            <span>Unverified</span>
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                        {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className={styles.actionBtnGroup}>
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className={styles.actionEditBtn}
                            title="Edit user profile & password"
                          >
                            <Edit3 size={13} />
                            <span>Edit / Password</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveUser(u);
                              setShowDeleteModal(true);
                            }}
                            className={styles.actionDeleteBtn}
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
      </section>

      {/* 4. EDIT USER & PASSWORD RESET MODAL */}
      {showEditModal && activeUser && (
        <div className={styles.modalBackdrop} onClick={() => !submitting && setShowEditModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Tenant User</h3>
              <p className={styles.modalDesc}>
                Update profile details, assign company affiliation, or reset master password for <strong>{activeUser.name}</strong>.
              </p>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Full Name</label>
                <input
                  required
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Email Address</label>
                <input
                  required
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className={styles.modalInput}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalLabel}>Company / Tenant</label>
                  <select
                    value={editFormData.companyId}
                    onChange={(e) => setEditFormData({ ...editFormData, companyId: e.target.value })}
                    className={styles.modalInput}
                  >
                    <option value="">No Company</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.modalFormGroup}>
                  <label className={styles.modalLabel}>Tenant Role</label>
                  <input
                    type="text"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className={styles.modalInput}
                    placeholder="e.g. Owner, Admin, Member"
                  />
                </div>
              </div>

              <div className={styles.modalFormGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#f1f5f9' }}>
                  <input
                    type="checkbox"
                    checked={editFormData.emailVerified}
                    onChange={(e) => setEditFormData({ ...editFormData, emailVerified: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                  />
                  Mark Email as Verified
                </label>
              </div>

              {/* Password Reset Danger Zone */}
              <div className={styles.passwordResetBox}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#fbbf24' }}>
                  <KeyRound size={15} /> Reset User Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep existing password"
                  value={editFormData.newPassword}
                  onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                  className={styles.modalInput}
                  style={{ background: 'rgba(0, 0, 0, 0.4)' }}
                />
              </div>

              <div className={styles.modalActionsRow}>
                <button 
                  type="button" 
                  className={styles.modalCancelBtn} 
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.modalSaveBtn} 
                  disabled={submitting}
                >
                  {submitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION MODAL */}
      {showDeleteModal && activeUser && (
        <div className={styles.modalBackdrop} onClick={() => !submitting && setShowDeleteModal(false)}>
          <div className={styles.modalCard} style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              marginBottom: '16px'
            }}>
              <Trash2 size={24} />
            </div>
            
            <h3 className={styles.modalTitle} style={{ fontSize: '19px' }}>Delete Tenant User?</h3>
            <p className={styles.modalDesc} style={{ lineHeight: '1.6', marginBottom: '22px' }}>
              Are you sure you want to permanently delete <strong>{activeUser.name}</strong> (<code>{activeUser.email}</code>)? This will immediately revoke their tenant authorization and credentials.
            </p>

            <div className={styles.modalActionsRow}>
              <button 
                type="button" 
                className={styles.modalCancelBtn} 
                onClick={() => setShowDeleteModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteUser} 
                className={styles.modalDeleteBtn} 
                disabled={submitting}
              >
                {submitting ? 'Deleting Account...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
