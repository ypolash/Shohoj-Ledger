"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import styles from './leaves.module.css';

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
  employeeId: string;
  employee?: {
    firstName: string;
    lastName: string;
    designation?: string;
  };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  designation?: string;
}

const LEAVE_TYPES = ['CASUAL', 'SICK', 'ANNUAL', 'UNPAID', 'MATERNITY', 'PATERNITY'];

const EMPTY_FORM = {
  employeeId: '',
  type: 'CASUAL',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  reason: '',
};

/**
 * Helper: Calculate duration between two dates inclusive
 */
function getDurationDays(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
}

/**
 * Helper: Format date nicely
 */
function formatDate(dStr: string): string {
  if (!dStr) return '—';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return dStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * ERP HR — Redesigned Leaves & Absence Hub
 * Real-time time-off management with live metrics, multi-dimensional search & filtering,
 * dual table/card views, inline approve/reject workflows, and full CSV roster export.
 */
export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Map employee IDs to rich employee records
  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach(emp => map.set(emp.id, emp));
    return map;
  }, [employees]);

  // Load leaves and employees data
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    else setIsLoading(true);

    try {
      const [lRes, eRes] = await Promise.all([
        fetch('/api/leaves', { cache: 'no-store' }),
        fetch('/api/employees', { cache: 'no-store' }),
      ]);

      if (lRes.ok) {
        const lData = await lRes.json();
        setLeaves(Array.isArray(lData) ? lData : []);
      }
      if (eRes.ok) {
        const eData = await eRes.json();
        setEmployees(Array.isArray(eData) ? eData : []);
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to load leave telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Approve / Reject Actions
  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setSuccessMsg(`Leave request has been marked ${status.toLowerCase()} successfully.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        await loadData(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update leave status');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating leave status');
    } finally {
      setActionLoading(null);
    }
  };

  // Submit Leave Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId) {
      setError('Please select an employee.');
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError('Please provide valid start and end dates.');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError('End date cannot precede the start date.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit leave request.');
        return;
      }

      setSuccessMsg('Leave request submitted successfully.');
      setShowModal(false);
      setForm(EMPTY_FORM);
      await loadData(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setError('Network communication failure. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Derived filtered requests
  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const emp = employeeMap.get(l.employeeId) || l.employee;
      const fullName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : '';
      const designation = (emp as any)?.designation?.toLowerCase() || '';
      const empCode = (emp as any)?.employeeId?.toLowerCase() || '';
      const reason = (l.reason || '').toLowerCase();
      const type = (l.type || '').toLowerCase();

      // Search matching
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          fullName.includes(q) ||
          designation.includes(q) ||
          empCode.includes(q) ||
          reason.includes(q) ||
          type.includes(q);
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && l.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'ALL' && l.type !== typeFilter) {
        return false;
      }

      // Employee filter
      if (employeeFilter !== 'ALL' && l.employeeId !== employeeFilter) {
        return false;
      }

      return true;
    });
  }, [leaves, employeeMap, search, statusFilter, typeFilter, employeeFilter]);

  // Counts & KPI metrics
  const totalCount = leaves.length;
  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;
  const approvedCount = leaves.filter(l => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter(l => l.status === 'REJECTED').length;

  const totalProcessed = approvedCount + rejectedCount;
  const approvalRate = totalProcessed > 0 ? Math.round((approvedCount / totalProcessed) * 100) : 100;

  const hasActiveFilters = Boolean(
    search.trim() ||
    statusFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    employeeFilter !== 'ALL'
  );

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setEmployeeFilter('ALL');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLeaves.length === 0) return;
    const headers = [
      'Employee Name',
      'Employee ID',
      'Designation',
      'Leave Type',
      'Start Date',
      'End Date',
      'Duration Days',
      'Applied Date',
      'Status',
      'Reason',
    ];

    const rows = filteredLeaves.map(l => {
      const emp = employeeMap.get(l.employeeId) || l.employee;
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : l.employeeId;
      const empId = (emp as any)?.employeeId || '';
      const designation = emp?.designation || '';
      const duration = getDurationDays(l.startDate, l.endDate);

      return [
        empName,
        empId,
        designation,
        l.type,
        new Date(l.startDate).toLocaleDateString(),
        new Date(l.endDate).toLocaleDateString(),
        duration,
        new Date(l.createdAt).toLocaleDateString(),
        l.status,
        l.reason || '',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leaves_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Return CSS class for leave type badge
  const getTypeBadgeClass = (type: string) => {
    switch (type.toUpperCase()) {
      case 'CASUAL':
        return styles.typeCasual;
      case 'SICK':
        return styles.typeSick;
      case 'ANNUAL':
        return styles.typeAnnual;
      case 'UNPAID':
        return styles.typeUnpaid;
      case 'MATERNITY':
        return styles.typeMaternity;
      case 'PATERNITY':
        return styles.typePaternity;
      default:
        return styles.typeDefault;
    }
  };

  // Helper: Return CSS class for status pill
  const getStatusChipClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return styles.statusApproved;
      case 'PENDING':
        return styles.statusPending;
      case 'REJECTED':
        return styles.statusRejected;
      case 'CANCELLED':
        return styles.statusCancelled;
      default:
        return styles.statusCancelled;
    }
  };

  // Helper: Get type icon
  const getTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'SICK':
        return 'healing';
      case 'ANNUAL':
        return 'beach_access';
      case 'CASUAL':
        return 'schedule';
      case 'MATERNITY':
      case 'PATERNITY':
        return 'child_care';
      case 'UNPAID':
        return 'money_off';
      default:
        return 'event_note';
    }
  };

  // Duration in form
  const modalDuration = getDurationDays(form.startDate, form.endDate);

  return (
    <div className={styles.container}>
      {/* 1. Executive Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <div className={styles.livePulseDot} />
            <span className={styles.liveBadgeText}>Leave Telemetry • Time-Off & PTO Hub</span>
          </div>
          <h1 className={styles.pageTitle}>
            Leave Requests & Absence Management
            <span className={styles.titleBadge}>{totalCount} Applications</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Review employee leave requests, track absence intervals, execute instant approvals or rejections, and monitor operational workforce availability.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={handleExportCSV}
            className={styles.secondaryBtn}
            disabled={leaves.length === 0}
            title="Download CSV"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            Export CSV
          </button>

          <button
            onClick={() => loadData(true)}
            className={styles.secondaryBtn}
            disabled={isSyncing}
            title="Refresh Leave Records"
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
            Submit Leave Request
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

      {/* 2. KPI Telemetry Cards */}
      <section className={styles.kpiGrid}>
        {/* Total Applications */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#4f46e5' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>event_note</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>history</span>
              All-Time
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Applications</span>
            <span className={styles.kpiValue}>{totalCount}</span>
          </div>
          <div className={styles.kpiFooter}>
            <span>Recorded in system</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{employees.length} Staff</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>pending_actions</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${pendingCount > 0 ? styles.trendWarning : styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                {pendingCount > 0 ? 'priority_high' : 'check'}
              </span>
              {pendingCount > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Pending Approvals</span>
            <span className={styles.kpiValue} style={{ color: pendingCount > 0 ? '#d97706' : undefined }}>
              {pendingCount}
            </span>
          </div>
          <div className={styles.kpiFooter}>
            <span>Awaiting executive review</span>
            <span style={{ fontWeight: 700, color: pendingCount > 0 ? '#d97706' : '#10b981' }}>
              {pendingCount > 0 ? `${pendingCount} Urgent` : '0 Pending'}
            </span>
          </div>
        </div>

        {/* Approved Leaves */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>verified</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>trending_up</span>
              {approvalRate}% Ratio
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Approved Leaves</span>
            <span className={styles.kpiValue}>{approvedCount}</span>
          </div>
          <div className={styles.kpiFooter}>
            <span>Authorized time-off</span>
            <span style={{ fontWeight: 600, color: '#059669' }}>Active & Past</span>
          </div>
        </div>

        {/* Rejected / Exceptions */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>cancel</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${rejectedCount > 0 ? styles.trendDanger : styles.trendNeutral}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>block</span>
              {rejectedCount} Denied
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Rejected Requests</span>
            <span className={styles.kpiValue}>{rejectedCount}</span>
          </div>
          <div className={styles.kpiFooter}>
            <span>Declined applications</span>
            <span style={{ fontWeight: 600 }}>Archived</span>
          </div>
        </div>
      </section>

      {/* 3. Controls & Filter Bar */}
      <section className={styles.controlsCard}>
        <div className={styles.controlsTopRow}>
          {/* Search Box */}
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input
              type="text"
              placeholder="Search by employee name, ID, leave type, or reason..."
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

          <div className={styles.filtersGroup}>
            {/* Leave Type Dropdown */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className={styles.selectDropdown}
            >
              <option value="ALL">All Leave Types</option>
              {LEAVE_TYPES.map(t => (
                <option key={t} value={t}>{t} Leave</option>
              ))}
            </select>

            {/* Employee Dropdown */}
            <select
              value={employeeFilter}
              onChange={e => setEmployeeFilter(e.target.value)}
              className={styles.selectDropdown}
            >
              <option value="ALL">All Personnel</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} {emp.employeeId ? `(${emp.employeeId})` : ''}
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button onClick={handleResetFilters} className={styles.resetBtn} title="Clear all filters">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_alt_off</span>
                Reset
              </button>
            )}
          </div>
        </div>

        <div className={styles.controlsBottomRow}>
          {/* Status Tabs */}
          <div className={styles.statusTabsList}>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`${styles.statusTabBtn} ${statusFilter === 'ALL' ? styles.statusTabBtnActive : ''}`}
            >
              All Requests
              <span style={{ opacity: 0.7 }}>({totalCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`${styles.statusTabBtn} ${statusFilter === 'PENDING' ? styles.statusTabBtnActive : ''}`}
            >
              Pending
              <span style={{ opacity: 0.7 }}>({pendingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`${styles.statusTabBtn} ${statusFilter === 'APPROVED' ? styles.statusTabBtnActive : ''}`}
            >
              Approved
              <span style={{ opacity: 0.7 }}>({approvedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`${styles.statusTabBtn} ${statusFilter === 'REJECTED' ? styles.statusTabBtnActive : ''}`}
            >
              Rejected
              <span style={{ opacity: 0.7 }}>({rejectedCount})</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className={styles.viewToggleGroup}>
            <button
              onClick={() => setViewMode('table')}
              className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
              title="Table View"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>table_rows</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
              title="Card Grid View"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>grid_view</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Main Leave Requests Display */}
      {isLoading ? (
        <div className={styles.tableCard}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton} style={{ height: '48px', width: '100%' }} />
            ))}
          </div>
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className={styles.emptyStateBox}>
          <div className={styles.emptyStateIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>event_busy</span>
          </div>
          <h3 className={styles.emptyStateTitle}>No Leave Requests Found</h3>
          <p className={styles.emptyStateDesc}>
            {hasActiveFilters
              ? 'No requests match your current search and filter criteria. Try adjusting or clearing your filters.'
              : 'There are currently no leave requests recorded in the system. Use the button below to submit one.'}
          </p>
          {hasActiveFilters ? (
            <button onClick={handleResetFilters} className={styles.secondaryBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_alt_off</span>
              Clear Filters
            </button>
          ) : (
            <button onClick={() => setShowModal(true)} className={styles.primaryBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              Submit First Leave
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className={styles.tableCard}>
          <table className={styles.dataTable}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.tableHeaderCell}>Employee</th>
                <th className={styles.tableHeaderCell}>Leave Type</th>
                <th className={styles.tableHeaderCell}>Date Range & Duration</th>
                <th className={styles.tableHeaderCell}>Reason / Context</th>
                <th className={styles.tableHeaderCell}>Applied Date</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map(l => {
                const emp = employeeMap.get(l.employeeId) || l.employee;
                const firstName = emp?.firstName || 'Unknown';
                const lastName = emp?.lastName || '';
                const empCode = (emp as any)?.employeeId || l.employeeId.slice(0, 8);
                const designation = emp?.designation || 'Staff Member';
                const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'EM';
                const duration = getDurationDays(l.startDate, l.endDate);
                const isPending = l.status === 'PENDING';
                const isApproved = l.status === 'APPROVED';
                const isRejected = l.status === 'REJECTED';
                const isActionBusy = actionLoading === l.id;

                return (
                  <tr key={l.id} className={styles.tableRow}>
                    {/* Employee Profile */}
                    <td className={styles.tableCell}>
                      <div className={styles.employeeProfileGroup}>
                        <div className={styles.empAvatar}>{initials}</div>
                        <div className={styles.empDetailsGroup}>
                          <span className={styles.empName}>{firstName} {lastName}</span>
                          <span className={styles.empDesignation}>{designation}</span>
                          <span className={styles.empIdBadge}>#{empCode}</span>
                        </div>
                      </div>
                    </td>

                    {/* Leave Type */}
                    <td className={styles.tableCell}>
                      <span className={`${styles.leaveTypeChip} ${getTypeBadgeClass(l.type)}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                          {getTypeIcon(l.type)}
                        </span>
                        {l.type}
                      </span>
                    </td>

                    {/* Date Range & Duration */}
                    <td className={styles.tableCell}>
                      <div className={styles.dateRangeBox}>
                        <span className={styles.dateRangeText}>
                          {formatDate(l.startDate)} → {formatDate(l.endDate)}
                        </span>
                        <span className={styles.durationBadge}>
                          {duration} {duration === 1 ? 'Day' : 'Days'}
                        </span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className={styles.tableCell}>
                      <span className={styles.reasonText} title={l.reason}>
                        {l.reason || '—'}
                      </span>
                    </td>

                    {/* Applied Date */}
                    <td className={styles.tableCell}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatDate(l.createdAt)}
                      </span>
                    </td>

                    {/* Status Pill */}
                    <td className={styles.tableCell}>
                      <span className={`${styles.statusChip} ${getStatusChipClass(l.status)}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          {isApproved ? 'check_circle' : isPending ? 'schedule' : 'cancel'}
                        </span>
                        {l.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                      <div className={styles.actionBtnGroup} style={{ justifyContent: 'flex-end' }}>
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleAction(l.id, 'APPROVED')}
                              disabled={isActionBusy}
                              className={styles.approveBtn}
                              title="Approve Leave Request"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check</span>
                              {isActionBusy ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleAction(l.id, 'REJECTED')}
                              disabled={isActionBusy}
                              className={styles.rejectBtn}
                              title="Reject Leave Request"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>close</span>
                              {isActionBusy ? '...' : 'Reject'}
                            </button>
                          </>
                        ) : isApproved ? (
                          <button
                            onClick={() => handleAction(l.id, 'REJECTED')}
                            disabled={isActionBusy}
                            className={styles.rejectBtn}
                            title="Revoke / Reject"
                            style={{ opacity: 0.8 }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>undo</span>
                            Revoke
                          </button>
                        ) : isRejected ? (
                          <button
                            onClick={() => handleAction(l.id, 'APPROVED')}
                            disabled={isActionBusy}
                            className={styles.approveBtn}
                            title="Re-approve"
                            style={{ opacity: 0.8 }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check</span>
                            Re-approve
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className={styles.cardGrid}>
          {filteredLeaves.map(l => {
            const emp = employeeMap.get(l.employeeId) || l.employee;
            const firstName = emp?.firstName || 'Unknown';
            const lastName = emp?.lastName || '';
            const empCode = (emp as any)?.employeeId || l.employeeId.slice(0, 8);
            const designation = emp?.designation || 'Staff Member';
            const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'EM';
            const duration = getDurationDays(l.startDate, l.endDate);
            const isPending = l.status === 'PENDING';
            const isApproved = l.status === 'APPROVED';
            const isRejected = l.status === 'REJECTED';
            const isActionBusy = actionLoading === l.id;

            return (
              <div key={l.id} className={styles.leaveCard}>
                {/* Top Profile & Status */}
                <div className={styles.cardTopRow}>
                  <div className={styles.employeeProfileGroup}>
                    <div className={styles.empAvatar}>{initials}</div>
                    <div className={styles.empDetailsGroup}>
                      <span className={styles.empName}>{firstName} {lastName}</span>
                      <span className={styles.empDesignation}>{designation}</span>
                      <span className={styles.empIdBadge}>#{empCode}</span>
                    </div>
                  </div>

                  <span className={`${styles.statusChip} ${getStatusChipClass(l.status)}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      {isApproved ? 'check_circle' : isPending ? 'schedule' : 'cancel'}
                    </span>
                    {l.status}
                  </span>
                </div>

                {/* Type & Days Summary */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span className={`${styles.leaveTypeChip} ${getTypeBadgeClass(l.type)}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                      {getTypeIcon(l.type)}
                    </span>
                    {l.type} Leave
                  </span>
                  <span className={styles.durationBadge} style={{ fontSize: '12px', padding: '3px 8px' }}>
                    {duration} {duration === 1 ? 'Day' : 'Days'} Duration
                  </span>
                </div>

                {/* Date Range Banner */}
                <div className={styles.cardDateRangeBanner}>
                  <div className={styles.cardDateRangeDates}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#6366f1' }}>
                      date_range
                    </span>
                    <span>{formatDate(l.startDate)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <span>{formatDate(l.endDate)}</span>
                  </div>
                </div>

                {/* Reason Quote */}
                <div className={styles.cardReasonBox}>
                  &ldquo;{l.reason || 'No specific justification recorded'}&rdquo;
                </div>

                {/* Card Footer & Quick Decisions */}
                <div className={styles.cardFooter}>
                  <span>Applied {formatDate(l.createdAt)}</span>

                  <div className={styles.actionBtnGroup}>
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleAction(l.id, 'APPROVED')}
                          disabled={isActionBusy}
                          className={styles.approveBtn}
                          title="Approve Request"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check</span>
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(l.id, 'REJECTED')}
                          disabled={isActionBusy}
                          className={styles.rejectBtn}
                          title="Reject Request"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>close</span>
                          Reject
                        </button>
                      </>
                    ) : isApproved ? (
                      <button
                        onClick={() => handleAction(l.id, 'REJECTED')}
                        disabled={isActionBusy}
                        className={styles.rejectBtn}
                        style={{ opacity: 0.8 }}
                      >
                        Revoke
                      </button>
                    ) : isRejected ? (
                      <button
                        onClick={() => handleAction(l.id, 'APPROVED')}
                        disabled={isActionBusy}
                        className={styles.approveBtn}
                        style={{ opacity: 0.8 }}
                      >
                        Re-approve
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Submit Leave Request Modal */}
      {showModal && (
        <div
          className={styles.modalBackdrop}
          onClick={e => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className={styles.kpiIconBox} style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#4f46e5' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_task</span>
                </div>
                <h2 className={styles.modalTitle}>Submit Leave Request</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className={styles.modalCloseBtn}
                title="Close modal"
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

            <form onSubmit={handleSubmit} className={styles.formGrid}>
              {/* Employee Selection */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Personnel / Employee *</label>
                <select
                  value={form.employeeId}
                  onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  required
                  className={styles.formInput}
                >
                  <option value="">— Select Employee —</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} {e.employeeId ? `(#${e.employeeId})` : ''} {e.designation ? `· ${e.designation}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Type */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Leave Category *</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  required
                  className={styles.formInput}
                >
                  {LEAVE_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t} Leave
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Ranges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    required
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>End Date *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    required
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* Calculated Duration Display */}
              {form.startDate && form.endDate && (
                <div className={styles.durationPreviewTag}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                  <span>Calculated Time-Off: <strong>{modalDuration} {modalDuration === 1 ? 'day' : 'days'}</strong></span>
                </div>
              )}

              {/* Reason */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Justification / Reason *</label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Explain the reason for requesting time-off..."
                  required
                  rows={3}
                  className={styles.formTextarea}
                />
              </div>

              {/* Modal Actions */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.secondaryBtn}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={submitting}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {submitting ? 'hourglass_empty' : 'send'}
                  </span>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
