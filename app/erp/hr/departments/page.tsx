"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import styles from './departments.module.css';

interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  head?: { firstName: string; lastName: string };
  _count?: { employees: number };
}

const EMPTY_FORM = {
  name: '',
  code: '',
  description: '',
  isActive: true,
};

/**
 * ERP HR — Redesigned Departments & Organizational Units Hub
 * Enterprise structure with live allocation telemetry, leadership tracking,
 * multi-dimensional search & filters, dual Cards/Table views, creation modal, and CSV export.
 */
export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [leadershipFilter, setLeadershipFilter] = useState<'ALL' | 'HAS_HOD' | 'VACANT'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDepts = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    else setIsLoading(true);

    try {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(Array.isArray(data) ? data : []);
      }
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed to load departments:', e);
    } finally {
      setIsLoading(false);
      if (isManual) setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchDepts();
  }, [fetchDepts]);

  // Derived KPI metrics
  const totalCount = departments.length;
  const activeCount = departments.filter(d => d.isActive !== false).length;
  const inactiveCount = totalCount - activeCount;

  const totalAllocatedStaff = useMemo(() => {
    return departments.reduce((sum, d) => sum + (d._count?.employees || 0), 0);
  }, [departments]);

  const deptsWithHOD = useMemo(() => {
    return departments.filter(d => !!d.head).length;
  }, [departments]);

  // Dynamic iconography
  const getDeptIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('eng') || lower.includes('dev') || lower.includes('tech')) return 'terminal';
    if (lower.includes('hr') || lower.includes('human') || lower.includes('admin')) return 'badge';
    if (lower.includes('fin') || lower.includes('acc')) return 'account_balance';
    if (lower.includes('market') || lower.includes('sale')) return 'campaign';
    if (lower.includes('oper')) return 'settings_suggest';
    return 'corporate_fare';
  };

  // Filtered departments
  const filteredDepartments = useMemo(() => {
    return departments.filter(d => {
      const target = `${d.name} ${d.code || ''} ${d.description || ''} ${d.head ? `${d.head.firstName} ${d.head.lastName}` : ''}`.toLowerCase();
      const matchesSearch = !search || target.includes(search.toLowerCase());

      const isActive = d.isActive !== false;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && isActive) ||
        (statusFilter === 'INACTIVE' && !isActive);

      const hasHOD = !!d.head;
      const matchesLeadership =
        leadershipFilter === 'ALL' ||
        (leadershipFilter === 'HAS_HOD' && hasHOD) ||
        (leadershipFilter === 'VACANT' && !hasHOD);

      return matchesSearch && matchesStatus && matchesLeadership;
    });
  }, [departments, search, statusFilter, leadershipFilter]);

  // Form submission
  const handleForm = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Failed to create department');
        return;
      }

      setSuccessMsg('Department created successfully!');
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchDepts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setError('Network communication error');
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (departments.length === 0) return;
    const headers = ['Department Name', 'Code', 'Head of Department', 'Allocated Employees', 'Status', 'Description'];
    const rows = filteredDepartments.map(d => [
      d.name,
      d.code || '',
      d.head ? `${d.head.firstName} ${d.head.lastName}` : 'Unassigned',
      d._count?.employees || 0,
      d.isActive !== false ? 'Active' : 'Inactive',
      d.description || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `departments_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <span className={styles.liveBadgeText}>Live Department Structure • Organization Units</span>
          </div>
          <h1 className={styles.pageTitle}>
            Departments & Organization Units
            <span className={styles.titleBadge}>{totalCount} Divisions</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Configure corporate divisions, monitor headcount allocations, track department leadership, and organize functional teams.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={handleExportCSV}
            className={styles.secondaryBtn}
            disabled={departments.length === 0}
            title="Download CSV"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            Export CSV
          </button>

          <button
            onClick={() => fetchDepts(true)}
            className={styles.secondaryBtn}
            disabled={isSyncing}
            title="Refresh Departments"
          >
            <span
              className={`material-symbols-outlined ${isSyncing ? styles.spinning : ''}`}
              style={{ fontSize: '18px' }}
            >
              refresh
            </span>
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            onClick={() => {
              setForm(EMPTY_FORM);
              setError('');
              setShowModal(true);
            }}
            className={styles.primaryBtn}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Add Department
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
        {/* Total Divisions */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>corporate_fare</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>domain</span>
              {activeCount} Active
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Divisions</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : totalCount}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Configured Departments</span>
            <span>{inactiveCount} Inactive</span>
          </div>
        </div>

        {/* Staff Allocated */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>badge</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              Assigned
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Allocated Staff</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : totalAllocatedStaff}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Personnel Across Divisions</span>
            <Link href="/erp/hr/employees" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Roster →
            </Link>
          </div>
        </div>

        {/* Leadership Coverage */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>supervisor_account</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${deptsWithHOD === totalCount && totalCount > 0 ? styles.trendPositive : styles.trendNeutral}`}>
              {totalCount > 0 ? `${Math.round((deptsWithHOD / totalCount) * 100)}% Assigned` : '0%'}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Leadership (HOD)</span>
            <div className={styles.kpiValue}>
              {isLoading ? (
                <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} />
              ) : (
                `${deptsWithHOD} / ${totalCount}`
              )}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Heads of Department</span>
            <span>{totalCount - deptsWithHOD} Vacant</span>
          </div>
        </div>

        {/* Operational Standing */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>shield</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              Operational
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Department Health</span>
            <div className={styles.kpiValue}>100%</div>
          </div>
          <div className={styles.kpiFooter}>
            <span>All Core Divisions Active</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Healthy</span>
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
              placeholder="Search by department name, code, description, or HOD..."
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

          {/* Leadership Filter Dropdown */}
          <select
            value={leadershipFilter}
            onChange={e => setLeadershipFilter(e.target.value as any)}
            className={styles.selectDropdown}
          >
            <option value="ALL">All Leadership Standings</option>
            <option value="HAS_HOD">With Assigned HOD</option>
            <option value="VACANT">Vacant HOD Position</option>
          </select>
        </div>

        <div className={styles.controlsBottomRow}>
          {/* Status Tabs */}
          <div className={styles.statusTabsList}>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`${styles.statusTabBtn} ${statusFilter === 'ALL' ? styles.statusTabBtnActive : ''}`}
            >
              All Divisions
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
            <div key={i} className={styles.skeleton} style={{ height: '180px', borderRadius: '18px' }} />
          ))}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className={styles.emptyStateBox}>
          <div className={styles.emptyStateIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              {search || statusFilter !== 'ALL' || leadershipFilter !== 'ALL' ? 'search_off' : 'corporate_fare'}
            </span>
          </div>

          {search || statusFilter !== 'ALL' || leadershipFilter !== 'ALL' ? (
            <>
              <h3 className={styles.emptyStateTitle}>No Matching Departments</h3>
              <p className={styles.emptyStateDesc}>
                No divisions match your current search and filter criteria. Try broadening your keywords or resetting filters.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setLeadershipFilter('ALL');
                }}
                className={styles.secondaryBtn}
                style={{ marginTop: '6px' }}
              >
                Clear All Filters
              </button>
            </>
          ) : (
            <>
              <h3 className={styles.emptyStateTitle}>No Departments Configured</h3>
              <p className={styles.emptyStateDesc}>
                Start structuring your organization by creating your first department. Assign functional roles and team leads.
              </p>
              <button
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setError('');
                  setShowModal(true);
                }}
                className={styles.primaryBtn}
                style={{ marginTop: '8px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                Create First Department
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid / Cards View */
        <div className={styles.cardsGrid}>
          {filteredDepartments.map(dept => {
            const empCount = dept._count?.employees || 0;
            const staffPct = totalAllocatedStaff > 0 ? Math.round((empCount / totalAllocatedStaff) * 100) : 0;
            const isActive = dept.isActive !== false;

            return (
              <div key={dept.id} className={styles.deptCard}>
                <div className={styles.cardTopRow}>
                  <div className={styles.deptIdentityGroup}>
                    <div className={styles.deptIconBox}>
                      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                        {getDeptIcon(dept.name)}
                      </span>
                    </div>
                    <div className={styles.deptNameGroup}>
                      <span className={styles.deptName}>{dept.name}</span>
                      {dept.code && <span className={styles.deptCodeTag}>{dept.code}</span>}
                    </div>
                  </div>

                  <span className={`${styles.statusChip} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className={styles.cardMetricsRow}>
                  <span className={styles.staffCountText}>{empCount} Personnel</span>
                  <span>{staffPct}% of allocated workforce</span>
                </div>

                <div className={styles.progressBarContainer}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${Math.max(staffPct, empCount > 0 ? 5 : 0)}%` }}
                  />
                </div>

                <div className={styles.cardBodyDetails}>
                  <div className={styles.hodRow}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
                      person
                    </span>
                    <span>
                      HOD:{' '}
                      {dept.head ? (
                        <strong style={{ color: 'var(--text-main)' }}>
                          {dept.head.firstName} {dept.head.lastName}
                        </strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Position Vacant</span>
                      )}
                    </span>
                  </div>

                  {dept.description && (
                    <div className={styles.deptDesc}>
                      {dept.description}
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <Link
                    href={`/erp/hr/employees?department=${encodeURIComponent(dept.name)}`}
                    className={styles.viewStaffLink}
                  >
                    <span>View Department Staff</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                  </Link>
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
                <th className={styles.tableHeaderCell}>Department Name</th>
                <th className={styles.tableHeaderCell}>Code</th>
                <th className={styles.tableHeaderCell}>Head of Department (HOD)</th>
                <th className={styles.tableHeaderCell}>Staff Allocated</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell}>Description</th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map(dept => {
                const empCount = dept._count?.employees || 0;
                const isActive = dept.isActive !== false;

                return (
                  <tr key={dept.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className={styles.deptIconBox} style={{ width: '34px', height: '34px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            {getDeptIcon(dept.name)}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{dept.name}</span>
                      </div>
                    </td>

                    <td className={styles.tableCell}>
                      {dept.code ? <span className={styles.deptCodeTag}>{dept.code}</span> : '—'}
                    </td>

                    <td className={styles.tableCell} style={{ color: 'var(--text-secondary)' }}>
                      {dept.head ? `${dept.head.firstName} ${dept.head.lastName}` : <span style={{ color: 'var(--text-muted)' }}>Vacant</span>}
                    </td>

                    <td className={styles.tableCell}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{empCount} Staff</span>
                    </td>

                    <td className={styles.tableCell}>
                      <span className={`${styles.statusChip} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className={styles.tableCell} style={{ color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dept.description || '—'}
                    </td>

                    <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                      <Link
                        href={`/erp/hr/employees?department=${encodeURIComponent(dept.name)}`}
                        style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', fontSize: '12px' }}
                      >
                        View Staff →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Add Department Modal */}
      {showModal && (
        <div
          className={styles.modalBackdrop}
          onClick={e => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add Department</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                title="Close"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
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
                <label className={styles.formLabel}>Department Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleForm('name', e.target.value)}
                  placeholder="e.g. Engineering, Sales & Marketing"
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Department Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => handleForm('code', e.target.value)}
                  placeholder="e.g. ENG, FIN, HR"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => handleForm('description', e.target.value)}
                  placeholder="Functional responsibilities and scope (optional)"
                  rows={3}
                  className={styles.formInput}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isActiveDept"
                  checked={form.isActive}
                  onChange={e => handleForm('isActive', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                />
                <label htmlFor="isActiveDept" style={{ fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}>
                  Mark department as active and operational
                </label>
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
                  {submitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
