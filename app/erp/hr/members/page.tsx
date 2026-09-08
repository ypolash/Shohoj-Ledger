"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import styles from './members.module.css';

interface Member {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  status: string;
  joinedAt: string;
  advanceBalance?: number;
}

const EMPTY_FORM = {
  id: '',
  name: '',
  role: '',
  email: '',
  phone: '',
  status: 'ACTIVE',
  joinedAt: new Date().toISOString().split('T')[0],
};

/**
 * ERP HR — Redesigned Members Directory & Workforce Network
 * Enterprise roster with live metrics, multi-dimensional search & filters,
 * dual Cards/Table views, full CRUD modal workflows, and CSV export.
 */
export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchMembers = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    else setIsLoading(true);

    try {
      const res = await fetch('/api/hr/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      }
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed to load members:', e);
    } finally {
      setIsLoading(false);
      if (isManual) setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Derived KPI metrics
  const totalCount = members.length;
  const activeCount = members.filter(m => (m.status || 'ACTIVE') === 'ACTIVE').length;
  const inactiveCount = totalCount - activeCount;

  const uniqueRoles = useMemo(() => {
    const set = new Set(members.map(m => m.role).filter(Boolean));
    return Array.from(set);
  }, [members]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const target = `${m.name} ${m.role} ${m.email || ''} ${m.phone || ''}`.toLowerCase();
      const matchesSearch = !search || target.includes(search.toLowerCase());

      const matchesRole = selectedRole === 'ALL' || m.role === selectedRole;

      const mStatus = m.status || 'ACTIVE';
      const matchesStatus = statusFilter === 'ALL' || mStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, search, selectedRole, statusFilter]);

  // Form handlers
  const handleForm = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setIsEditing(false);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (e: React.MouseEvent, member: Member) => {
    e.preventDefault();
    e.stopPropagation();
    setForm({
      id: member.id,
      name: member.name,
      role: member.role,
      email: member.email || '',
      phone: member.phone || '',
      status: member.status || 'ACTIVE',
      joinedAt: member.joinedAt ? member.joinedAt.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setIsEditing(true);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const url = isEditing ? `/api/hr/members/${form.id}` : '/api/hr/members';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        name: form.name,
        role: form.role,
        email: form.email || null,
        phone: form.phone || null,
        status: form.status,
        joinedAt: new Date(form.joinedAt).toISOString(),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Failed to save member');
        return;
      }

      setSuccessMsg(isEditing ? 'Member updated successfully!' : 'Member enrolled successfully!');
      setShowModal(false);
      fetchMembers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setError('Network communication error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to remove member "${name}"?`)) return;

    try {
      const res = await fetch(`/api/hr/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg(`Member "${name}" removed!`);
        fetchMembers();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete member');
      }
    } catch {
      alert('Network communication error');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (members.length === 0) return;
    const headers = ['Member Name', 'Role', 'Email', 'Phone', 'Status', 'Join Date'];
    const rows = filteredMembers.map(m => [
      m.name || '',
      m.role || '',
      m.email || '',
      m.phone || '',
      m.status || 'ACTIVE',
      m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `members_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      {/* 1. Executive Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <div className={styles.livePulseDot} />
            <span className={styles.liveBadgeText}>Live Membership Roster • HR Operations</span>
          </div>
          <h1 className={styles.pageTitle}>
            Members & Associates Directory
            <span className={styles.titleBadge}>{totalCount} Enrolled</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Manage auxiliary personnel, operational associates, volunteers, and collaborative partners.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={handleExportCSV}
            className={styles.secondaryBtn}
            disabled={members.length === 0}
            title="Download CSV Roster"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            Export CSV
          </button>

          <button
            onClick={() => fetchMembers(true)}
            className={styles.secondaryBtn}
            disabled={isSyncing}
            title="Refresh Member Data"
          >
            <span
              className={`material-symbols-outlined ${isSyncing ? styles.spinning : ''}`}
              style={{ fontSize: '18px' }}
            >
              refresh
            </span>
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button onClick={openAddModal} className={styles.primaryBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            Add Member
          </button>
        </div>
      </header>

      {/* Success Alert Banner */}
      {successMsg && (
        <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Operational Workforce KPI Cards */}
      <section className={styles.kpiGrid}>
        {/* Total Enrolled */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#ec4899' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>groups</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>how_to_reg</span>
              {totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% Active` : '0%'}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Enrolled</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : totalCount}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Active: {activeCount}</span>
            <span>Inactive: {inactiveCount}</span>
          </div>
        </div>

        {/* Active Members */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>verified_user</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              Active
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Active Members</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : activeCount}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Operational Standings</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Good</span>
          </div>
        </div>

        {/* Roles Represented */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>assignment_ind</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>
              Categorized
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Roles & Capacities</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : uniqueRoles.length}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Distinct Classifications</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Active</span>
          </div>
        </div>

        {/* Network Inactive */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(100, 116, 139, 0.12)', color: '#64748b' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>person_off</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>
              Standby
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Dormant / Inactive</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : inactiveCount}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Past or Pending Roster</span>
            <span>{totalCount > 0 ? `${Math.round((inactiveCount / totalCount) * 100)}%` : '0%'}</span>
          </div>
        </div>
      </section>

      {/* 3. Filter & Controls Bar */}
      <section className={styles.controlsCard}>
        <div className={styles.controlsTopRow}>
          {/* Search Box */}
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input
              type="text"
              placeholder="Search by member name, role, email, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} className={styles.clearSearchBtn} title="Clear search">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
          </div>

          {/* Role Dropdown */}
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className={styles.selectDropdown}
          >
            <option value="ALL">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controlsBottomRow}>
          {/* Status Tabs */}
          <div className={styles.statusTabsList}>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`${styles.statusTabBtn} ${statusFilter === 'ALL' ? styles.statusTabBtnActive : ''}`}
            >
              All Members
              <span style={{ opacity: 0.7 }}>({totalCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`${styles.statusTabBtn} ${statusFilter === 'ACTIVE' ? styles.statusTabBtnActive : ''}`}
            >
              Active
              <span style={{ opacity: 0.7 }}>({activeCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`${styles.statusTabBtn} ${statusFilter === 'INACTIVE' ? styles.statusTabBtnActive : ''}`}
            >
              Inactive
              <span style={{ opacity: 0.7 }}>({inactiveCount})</span>
            </button>
          </div>

          {/* View Switcher */}
          <div className={styles.viewToggleGroup}>
            <button
              onClick={() => setViewMode('grid')}
              className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
              title="Card Grid View"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
              title="Table View"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>table_rows</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Main Data Presentation: Cards vs Table vs Empty State */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={styles.skeleton} style={{ height: '180px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className={styles.emptyStateBox}>
          <div className={styles.emptyStateIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              {search || selectedRole !== 'ALL' || statusFilter !== 'ALL' ? 'person_search' : 'group_add'}
            </span>
          </div>

          {search || selectedRole !== 'ALL' || statusFilter !== 'ALL' ? (
            <>
              <h3 className={styles.emptyStateTitle}>No Matching Members Found</h3>
              <p className={styles.emptyStateDesc}>
                No members match your current filter settings. Try adjusting your query or resetting your criteria.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedRole('ALL');
                  setStatusFilter('ALL');
                }}
                className={styles.secondaryBtn}
                style={{ marginTop: '6px' }}
              >
                Clear All Filters
              </button>
            </>
          ) : (
            <>
              <h3 className={styles.emptyStateTitle}>No Members Enrolled Yet</h3>
              <p className={styles.emptyStateDesc}>
                Start building your membership network. Enroll associates, collaborators, and volunteer staff into your centralized roster.
              </p>
              <button onClick={openAddModal} className={styles.primaryBtn} style={{ marginTop: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                Enroll First Member
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid / Cards View */
        <div className={styles.cardsGrid}>
          {filteredMembers.map(member => {
            const initials = member.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'MB';

            const isActive = member.status === 'ACTIVE';

            return (
              <div key={member.id} className={styles.memberCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.memberProfileGroup}>
                    <div className={styles.memberAvatar}>{initials}</div>
                    <div className={styles.memberNameGroup}>
                      <span className={styles.memberName}>{member.name}</span>
                      <span className={styles.memberRoleBadge}>{member.role}</span>
                    </div>
                  </div>

                  <div className={styles.cardActionBtns}>
                    <button
                      onClick={e => openEditModal(e, member)}
                      className={styles.iconBtn}
                      title="Edit Member"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>edit</span>
                    </button>
                    <button
                      onClick={e => handleDelete(e, member.id, member.name)}
                      className={`${styles.iconBtn} ${styles.deleteBtn}`}
                      title="Delete Member"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>delete</span>
                    </button>
                  </div>
                </div>

                <div className={styles.cardContactList}>
                  <div className={styles.contactItem}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                      mail
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.email || 'No email provided'}
                    </span>
                  </div>

                  <div className={styles.contactItem}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                      call
                    </span>
                    <span>{member.phone || 'No phone recorded'}</span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '—'}
                  </span>

                  <span className={`${styles.statusChip} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                    {member.status || 'ACTIVE'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className={styles.tableCard}>
          <table className={styles.dataTable}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.tableHeaderCell}>Member Profile</th>
                <th className={styles.tableHeaderCell}>Role / Capacity</th>
                <th className={styles.tableHeaderCell}>Contact Email</th>
                <th className={styles.tableHeaderCell}>Phone Number</th>
                <th className={styles.tableHeaderCell}>Join Date</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => {
                const initials = member.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'MB';

                const isActive = member.status === 'ACTIVE';

                return (
                  <tr key={member.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className={styles.memberAvatar} style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                          {initials}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{member.name}</span>
                      </div>
                    </td>

                    <td className={styles.tableCell}>
                      <span className={styles.memberRoleBadge}>{member.role}</span>
                    </td>

                    <td className={styles.tableCell} style={{ color: 'var(--text-secondary)' }}>
                      {member.email || '—'}
                    </td>

                    <td className={styles.tableCell} style={{ color: 'var(--text-secondary)' }}>
                      {member.phone || '—'}
                    </td>

                    <td className={styles.tableCell} style={{ color: 'var(--text-muted)' }}>
                      {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '—'}
                    </td>

                    <td className={styles.tableCell}>
                      <span className={`${styles.statusChip} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                        {member.status || 'ACTIVE'}
                      </span>
                    </td>

                    <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={e => openEditModal(e, member)}
                          className={styles.iconBtn}
                          title="Edit"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>edit</span>
                        </button>
                        <button
                          onClick={e => handleDelete(e, member.id, member.name)}
                          className={`${styles.iconBtn} ${styles.deleteBtn}`}
                          title="Delete"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Add / Edit Member Modal */}
      {showModal && (
        <div
          className={styles.modalBackdrop}
          onClick={e => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {isEditing ? 'Update Member Profile' : 'Enroll New Member'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className={styles.iconBtn}
                title="Close Modal"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {error && (
              <div className={`${styles.alertBox} ${styles.alertDanger}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Legal Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleForm('name', e.target.value)}
                  placeholder="e.g. Tariq Ahmed"
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role / Capacity *</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={e => handleForm('role', e.target.value)}
                  placeholder="e.g. Volunteer, Contractor, Associate"
                  required
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => handleForm('email', e.target.value)}
                    placeholder="tariq@example.com"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => handleForm('phone', e.target.value)}
                    placeholder="+880 1712 345678"
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Standing Status</label>
                  <select
                    value={form.status}
                    onChange={e => handleForm('status', e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date Joined</label>
                  <input
                    type="date"
                    value={form.joinedAt}
                    onChange={e => handleForm('joinedAt', e.target.value)}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.secondaryBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.primaryBtn}
                >
                  {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Enroll Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
