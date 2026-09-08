"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import styles from './designations.module.css';

interface Designation {
  id: string;
  name: string;
  grade?: string;
  level?: string;
  description?: string;
  isActive: boolean;
  _count?: { employees: number };
}

const EMPTY_FORM = {
  name: '',
  grade: '',
  level: '',
  description: '',
};

/**
 * ERP HR — Redesigned Designations & Job Roles Hub
 * Enterprise job architecture with hierarchy tracking, staff allocations,
 * multi-dimensional search & filters, dual Cards/Table views, creation modal, and CSV export.
 */
export default function DesignationsPage() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
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

  const fetchDesignations = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    else setIsLoading(true);

    try {
      const res = await fetch('/api/designations');
      if (res.ok) {
        const data = await res.json();
        setDesignations(Array.isArray(data) ? data : []);
      }
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed to load designations:', e);
    } finally {
      setIsLoading(false);
      if (isManual) setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  // Derived KPI metrics
  const totalCount = designations.length;
  const activeCount = designations.filter(d => d.isActive !== false).length;
  const inactiveCount = totalCount - activeCount;

  const totalAssignedStaff = useMemo(() => {
    return designations.reduce((sum, d) => sum + (d._count?.employees || 0), 0);
  }, [designations]);

  const uniqueGrades = useMemo(() => {
    const set = new Set(designations.map(d => d.grade).filter(Boolean) as string[]);
    return Array.from(set);
  }, [designations]);

  const uniqueLevels = useMemo(() => {
    const set = new Set(designations.map(d => d.level).filter(Boolean) as string[]);
    return Array.from(set);
  }, [designations]);

  // Filtered designations
  const filteredDesignations = useMemo(() => {
    return designations.filter(d => {
      const target = `${d.name} ${d.grade || ''} ${d.level || ''} ${d.description || ''}`.toLowerCase();
      const matchesSearch = !search || target.includes(search.toLowerCase());

      const matchesGrade = selectedGrade === 'ALL' || d.grade === selectedGrade;

      const isActive = d.isActive !== false;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && isActive) ||
        (statusFilter === 'INACTIVE' && !isActive);

      return matchesSearch && matchesGrade && matchesStatus;
    });
  }, [designations, search, selectedGrade, statusFilter]);

  // Form handlers
  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/designations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Failed to create designation');
        return;
      }

      setSuccessMsg('Designation created successfully!');
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchDesignations();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setError('Network communication error');
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (designations.length === 0) return;
    const headers = ['Designation Name', 'Grade', 'Seniority Level', 'Assigned Employees', 'Status', 'Description'];
    const rows = filteredDesignations.map(d => [
      d.name,
      d.grade || '',
      d.level || '',
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
    link.setAttribute('download', `designations_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <span className={styles.liveBadgeText}>Live Job Architecture • Organizational Hierarchy</span>
          </div>
          <h1 className={styles.pageTitle}>
            Designations & Job Roles
            <span className={styles.titleBadge}>{totalCount} Roles Configured</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Define corporate job titles, salary grades, seniority tiers, and staff allocations across all departments.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={handleExportCSV}
            className={styles.secondaryBtn}
            disabled={designations.length === 0}
            title="Download CSV"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            Export CSV
          </button>

          <button
            onClick={() => fetchDesignations(true)}
            className={styles.secondaryBtn}
            disabled={isSyncing}
            title="Refresh Designations"
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
            Add Designation
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
        {/* Total Roles */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>work</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>done_all</span>
              {activeCount} Active
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Job Titles</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : totalCount}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Configured Roles</span>
            <span>{inactiveCount} Inactive</span>
          </div>
        </div>

        {/* Assigned Staff */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>badge</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              Allocated
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Assigned Personnel</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : totalAssignedStaff}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Staff in Designated Roles</span>
            <Link href="/erp/hr/employees" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Roster →
            </Link>
          </div>
        </div>

        {/* Pay Grades */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>stairs</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>
              Pay Bands
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Career Grades</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : uniqueGrades.length}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Structured Salary Tiers</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Standardized</span>
          </div>
        </div>

        {/* Seniority Levels */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>military_tech</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              Hierarchy
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Seniority Tiers</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : uniqueLevels.length}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Distinct Competency Levels</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Defined</span>
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
              placeholder="Search by title, grade, seniority tier, or description..."
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

          {/* Grade Filter Dropdown */}
          <select
            value={selectedGrade}
            onChange={e => setSelectedGrade(e.target.value)}
            className={styles.selectDropdown}
          >
            <option value="ALL">All Career Grades</option>
            {uniqueGrades.map(grade => (
              <option key={grade} value={grade}>
                Grade {grade}
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
              All Roles
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
      ) : filteredDesignations.length === 0 ? (
        <div className={styles.emptyStateBox}>
          <div className={styles.emptyStateIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              {search || selectedGrade !== 'ALL' || statusFilter !== 'ALL' ? 'search_off' : 'work'}
            </span>
          </div>

          {search || selectedGrade !== 'ALL' || statusFilter !== 'ALL' ? (
            <>
              <h3 className={styles.emptyStateTitle}>No Matching Designations</h3>
              <p className={styles.emptyStateDesc}>
                No job titles match your current search and filter settings. Try broadening your keywords or resetting filters.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedGrade('ALL');
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
              <h3 className={styles.emptyStateTitle}>No Designations Configured</h3>
              <p className={styles.emptyStateDesc}>
                Create job titles, salary grades, and seniority levels to establish your organizational structure.
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
                Create First Designation
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid / Cards View */
        <div className={styles.cardsGrid}>
          {filteredDesignations.map(d => {
            const empCount = d._count?.employees || 0;
            const isActive = d.isActive !== false;

            return (
              <div key={d.id} className={styles.roleCard}>
                <div className={styles.cardTopRow}>
                  <div className={styles.roleIdentityGroup}>
                    <div className={styles.roleIconBox}>
                      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                        work
                      </span>
                    </div>
                    <div className={styles.roleNameGroup}>
                      <span className={styles.roleName}>{d.name}</span>
                      <div className={styles.gradeLevelBadges}>
                        {d.grade && <span className={styles.gradeChip}>Grade {d.grade}</span>}
                        {d.level && <span className={styles.levelChip}>{d.level}</span>}
                      </div>
                    </div>
                  </div>

                  <span className={`${styles.statusChip} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className={styles.cardMetricsRow}>
                  <span className={styles.staffCountText}>{empCount} Personnel</span>
                  <span>{empCount === 1 ? '1 active position' : `${empCount} active positions`}</span>
                </div>

                <div className={styles.cardBodyDetails}>
                  {d.description ? (
                    <span>{d.description}</span>
                  ) : (
                    <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Standard organizational job role</span>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <Link
                    href={`/erp/hr/employees?designation=${encodeURIComponent(d.name)}`}
                    className={styles.viewPersonnelLink}
                  >
                    <span>View Role Personnel</span>
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
                <th className={styles.tableHeaderCell}>Job Title / Designation</th>
                <th className={styles.tableHeaderCell}>Grade</th>
                <th className={styles.tableHeaderCell}>Seniority Level</th>
                <th className={styles.tableHeaderCell}>Assigned Staff</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell}>Description</th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDesignations.map(d => {
                const empCount = d._count?.employees || 0;
                const isActive = d.isActive !== false;

                return (
                  <tr key={d.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className={styles.roleIconBox} style={{ width: '34px', height: '34px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            work
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{d.name}</span>
                      </div>
                    </td>

                    <td className={styles.tableCell}>
                      {d.grade ? <span className={styles.gradeChip}>Grade {d.grade}</span> : '—'}
                    </td>

                    <td className={styles.tableCell}>
                      {d.level ? <span className={styles.levelChip}>{d.level}</span> : '—'}
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
                      {d.description || '—'}
                    </td>

                    <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                      <Link
                        href={`/erp/hr/employees?designation=${encodeURIComponent(d.name)}`}
                        style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', fontSize: '12px' }}
                      >
                        View Personnel →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Add Designation Modal */}
      {showModal && (
        <div
          className={styles.modalBackdrop}
          onClick={e => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add Designation</h2>
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
                <label className={styles.formLabel}>Designation Title *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleForm('name', e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  required
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Pay Grade</label>
                  <input
                    type="text"
                    value={form.grade}
                    onChange={e => handleForm('grade', e.target.value)}
                    placeholder="e.g. G4, Level 3"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Seniority Tier</label>
                  <input
                    type="text"
                    value={form.level}
                    onChange={e => handleForm('level', e.target.value)}
                    placeholder="e.g. Mid-Senior, Lead"
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Job Description</label>
                <textarea
                  value={form.description}
                  onChange={e => handleForm('description', e.target.value)}
                  placeholder="Responsibilities and qualifications (optional)"
                  rows={3}
                  className={styles.formInput}
                  style={{ resize: 'vertical' }}
                />
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
                  {submitting ? 'Creating...' : 'Create Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
