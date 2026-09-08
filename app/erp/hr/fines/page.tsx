"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './fines.module.css';

interface EmployeeFine {
  id: string;
  employeeId: string;
  amount: number | string;
  reason: string;
  date: string;
  status: 'PENDING' | 'DEDUCTED' | 'CANCELLED';
  createdAt?: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeId?: string;
    designation?: string;
  };
  payrollRun?: {
    period?: {
      name: string;
    };
  };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  designation?: string;
}

const EMPTY_FORM = {
  employeeId: '',
  amount: '',
  reason: '',
  date: new Date().toISOString().slice(0, 10),
};

const AMOUNT_PRESETS = [200, 500, 1000, 2500, 5000];
const REASON_SUGGESTIONS = [
  'Late Arrival Penalty',
  'Unapproved Absence (AWOL)',
  'Property Damage / Equipment Loss',
  'Policy & Security Violation',
  'Uniform / Safety Non-Compliance',
];

/**
 * Format currency in Bangladeshi Taka
 */
function formatBDT(amount: number | string): string {
  const num = Number(amount) || 0;
  return `৳${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date nicely
 */
function formatDate(dStr: string): string {
  if (!dStr) return '—';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return dStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * ERP HR — Redesigned Disciplinary Fines & Penalties Hub
 * Enterprise penalty governance with live deduction tracking, multi-dimensional search & filtering,
 * dual table/card views, policy rules visualizer, and instant CSV export.
 */
export default function FinesPage() {
  const [fines, setFines] = useState<EmployeeFine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'DEDUCTED' | 'CANCELLED'>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPolicy, setShowPolicy] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newFine, setNewFine] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Map employee IDs
  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach(emp => map.set(emp.id, emp));
    return map;
  }, [employees]);

  // Load fines and employees data
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    else setIsLoading(true);

    try {
      const [finesRes, empRes] = await Promise.all([
        fetch('/api/hr/fines', { cache: 'no-store' }),
        fetch('/api/employees', { cache: 'no-store' }),
      ]);

      if (finesRes.ok) {
        const fData = await finesRes.json();
        setFines(Array.isArray(fData.fines) ? fData.fines : []);
      }
      if (empRes.ok) {
        const eData = await empRes.json();
        const empList = Array.isArray(eData) ? eData : (eData.data || eData.employees || []);
        setEmployees(empList);
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed to load disciplinary records:', e);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle status update (Waive / Reinstate)
  const handleUpdateStatus = async (id: string, status: 'PENDING' | 'CANCELLED') => {
    const isWaiving = status === 'CANCELLED';
    if (isWaiving && !confirm('Are you sure you want to waive / cancel this fine?')) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/hr/fines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setSuccessMsg(isWaiving ? 'Penalty waived successfully.' : 'Penalty reinstated to pending status.');
        setTimeout(() => setSuccessMsg(''), 4000);
        await fetchData(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update penalty status');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating penalty status');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle fine deletion
  const handleDeleteFine = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this penalty record?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/hr/fines/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccessMsg('Penalty record deleted permanently.');
        setTimeout(() => setSuccessMsg(''), 4000);
        await fetchData(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete penalty');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting penalty');
    } finally {
      setActionLoading(null);
    }
  };

  // Create Fine
  const handleCreateFine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFine.employeeId) {
      setError('Please select an employee.');
      return;
    }
    if (!newFine.amount || Number(newFine.amount) <= 0) {
      setError('Please provide a valid penalty amount.');
      return;
    }
    if (!newFine.reason.trim()) {
      setError('Please provide a violation reason.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/hr/fines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFine),
      });

      if (res.ok) {
        setSuccessMsg('Disciplinary penalty assigned successfully.');
        setShowModal(false);
        setNewFine(EMPTY_FORM);
        await fetchData(false);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to assign penalty');
      }
    } catch {
      setError('Network communication failure. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered fines
  const filteredFines = useMemo(() => {
    return fines.filter(f => {
      const emp = f.employee || employeeMap.get(f.employeeId);
      const fullName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : '';
      const empCode = emp?.employeeId?.toLowerCase() || '';
      const reason = (f.reason || '').toLowerCase();
      const amountStr = String(f.amount);

      // Search matching
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          fullName.includes(q) ||
          empCode.includes(q) ||
          reason.includes(q) ||
          amountStr.includes(q);
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && f.status !== statusFilter) {
        return false;
      }

      // Employee filter
      if (employeeFilter !== 'ALL' && f.employeeId !== employeeFilter) {
        return false;
      }

      return true;
    });
  }, [fines, employeeMap, search, statusFilter, employeeFilter]);

  // Aggregate KPI metrics
  const totalCount = fines.length;
  const totalGrossAmount = fines.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const pendingFines = fines.filter(f => f.status === 'PENDING');
  const pendingCount = pendingFines.length;
  const pendingAmount = pendingFines.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const deductedFines = fines.filter(f => f.status === 'DEDUCTED');
  const deductedCount = deductedFines.length;
  const deductedAmount = deductedFines.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const cancelledFines = fines.filter(f => f.status === 'CANCELLED');
  const cancelledCount = cancelledFines.length;
  const cancelledAmount = cancelledFines.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const hasActiveFilters = Boolean(
    search.trim() ||
    statusFilter !== 'ALL' ||
    employeeFilter !== 'ALL'
  );

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setEmployeeFilter('ALL');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredFines.length === 0) return;
    const headers = [
      'Employee Name',
      'Employee ID',
      'Penalty Date',
      'Fine Amount (BDT)',
      'Status',
      'Violation Reason',
      'Payroll Period',
    ];

    const rows = filteredFines.map(f => {
      const emp = f.employee || employeeMap.get(f.employeeId);
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : f.employeeId;
      const empId = emp?.employeeId || '';
      const periodName = f.payrollRun?.period?.name || 'Unassigned';

      return [
        empName,
        empId,
        new Date(f.date).toLocaleDateString(),
        Number(f.amount).toFixed(2),
        f.status,
        f.reason || '',
        periodName,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `disciplinary_fines_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusChipClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return styles.statusPending;
      case 'DEDUCTED':
        return styles.statusDeducted;
      case 'CANCELLED':
        return styles.statusCancelled;
      default:
        return styles.statusCancelled;
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Executive Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <div className={styles.livePulseDot} />
            <span className={styles.liveBadgeText}>Disciplinary Governance • Deductions & Penalties</span>
          </div>
          <h1 className={styles.pageTitle}>
            Disciplinary Fines & Deductions
            <span className={styles.titleBadge}>{totalCount} Penalties</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Enforce organizational discipline, track payroll salary deductions, review policy violations, and manage pending or waived employee penalties.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={handleExportCSV}
            className={styles.secondaryBtn}
            disabled={fines.length === 0}
            title="Download CSV"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            Export CSV
          </button>

          <button
            onClick={() => fetchData(true)}
            className={styles.secondaryBtn}
            disabled={isSyncing}
            title="Refresh Fines"
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
              setNewFine(EMPTY_FORM);
              setError('');
              setShowModal(true);
            }}
            className={styles.primaryBtn}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>gavel</span>
            Assign Penalty
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

      {/* 2. Operational KPI Cards */}
      <section className={styles.kpiGrid}>
        {/* Total Penalties Recorded */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>account_balance_wallet</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendDanger}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>gavel</span>
              {totalCount} Total
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Gross Penalty Volume</span>
            <span className={styles.kpiValue}>{formatBDT(totalGrossAmount)}</span>
          </div>
          <div className={styles.kpiFooter}>
            <span>All recorded penalties</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{employees.length} Staff</span>
          </div>
        </div>

        {/* Pending Deductions */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>pending_actions</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${pendingCount > 0 ? styles.trendWarning : styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                {pendingCount > 0 ? 'schedule' : 'check'}
              </span>
              {pendingCount > 0 ? `${pendingCount} Pending` : 'All Settled'}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Pending Deductions</span>
            <span className={styles.kpiValue} style={{ color: pendingCount > 0 ? '#d97706' : undefined }}>
              {formatBDT(pendingAmount)}
            </span>
          </div>
          <div className={styles.kpiFooter}>
            <span>Awaiting next payroll run</span>
            <span style={{ fontWeight: 700, color: pendingCount > 0 ? '#d97706' : '#10b981' }}>
              {pendingCount} Queued
            </span>
          </div>
        </div>

        {/* Deducted via Payroll */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>price_check</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
              Settled
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Deducted in Payroll</span>
            <span className={styles.kpiValue}>{formatBDT(deductedAmount)}</span>
          </div>
          <div className={styles.kpiFooter}>
            <span>Recovered via salary deduction</span>
            <span style={{ fontWeight: 600, color: '#059669' }}>{deductedCount} Settled</span>
          </div>
        </div>

        {/* Waived / Cancelled */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(100, 116, 139, 0.12)', color: '#64748b' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>money_off</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>block</span>
              {cancelledCount} Waived
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Waived Penalties</span>
            <span className={styles.kpiValue}>{formatBDT(cancelledAmount)}</span>
          </div>
          <div className={styles.kpiFooter}>
            <span>Cancelled by management</span>
            <span style={{ fontWeight: 600 }}>Archived</span>
          </div>
        </div>
      </section>

      {/* 3. Collapsible Disciplinary Policy Standards */}
      <section className={styles.policyCard}>
        <div
          className={styles.policyHeaderRow}
          onClick={() => setShowPolicy(prev => !prev)}
          title="Toggle policy guidelines"
        >
          <div className={styles.policyHeaderTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#f43f5e' }}>policy</span>
            <span>Standard Disciplinary Rules & Deductions Reference</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>{showPolicy ? 'Hide Reference' : 'Show Reference'}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {showPolicy ? 'expand_less' : 'expand_more'}
            </span>
          </div>
        </div>

        {showPolicy && (
          <div className={styles.policyGrid}>
            <div className={styles.policyItem} style={{ borderLeftColor: 'var(--warning, #f59e0b)' }}>
              <div className={styles.policyItemTitle}>Late Arrival Fine</div>
              <div className={styles.policyItemDesc}>
                Applied automatically or manually based on configured shift attendance grace period settings.
              </div>
            </div>

            <div className={styles.policyItem} style={{ borderLeftColor: 'var(--danger, #ef4444)' }}>
              <div className={styles.policyItemTitle}>Unapproved Absence (AWOL)</div>
              <div className={styles.policyItemDesc}>
                Equivalent to 1 day&apos;s basic salary deduction for unauthorized days off duty.
              </div>
            </div>

            <div className={styles.policyItem} style={{ borderLeftColor: '#6366f1' }}>
              <div className={styles.policyItemTitle}>Property Damage / Equipment Loss</div>
              <div className={styles.policyItemDesc}>
                Direct deduction calculated as per actual certified repair or replacement invoice.
              </div>
            </div>

            <div className={styles.policyItem} style={{ borderLeftColor: '#059669' }}>
              <div className={styles.policyItemTitle}>General Policy Violation</div>
              <div className={styles.policyItemDesc}>
                Up to ৳5,000 disciplinary deduction based on committee audit decision.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. Controls & Filter Bar */}
      <section className={styles.controlsCard}>
        <div className={styles.controlsTopRow}>
          {/* Search Box */}
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input
              type="text"
              placeholder="Search by employee name, ID, violation reason, or amount..."
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
            {/* Employee Dropdown */}
            <select
              value={employeeFilter}
              onChange={e => setEmployeeFilter(e.target.value)}
              className={styles.selectDropdown}
            >
              <option value="ALL">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} {emp.employeeId ? `(#${emp.employeeId})` : ''}
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
              All Penalties
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
              onClick={() => setStatusFilter('DEDUCTED')}
              className={`${styles.statusTabBtn} ${statusFilter === 'DEDUCTED' ? styles.statusTabBtnActive : ''}`}
            >
              Deducted
              <span style={{ opacity: 0.7 }}>({deductedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('CANCELLED')}
              className={`${styles.statusTabBtn} ${statusFilter === 'CANCELLED' ? styles.statusTabBtnActive : ''}`}
            >
              Waived / Cancelled
              <span style={{ opacity: 0.7 }}>({cancelledCount})</span>
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

      {/* 5. Main Fines Display */}
      {isLoading ? (
        <div className={styles.tableCard}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeleton} style={{ height: '48px', width: '100%' }} />
            ))}
          </div>
        </div>
      ) : filteredFines.length === 0 ? (
        <div className={styles.emptyStateBox}>
          <div className={styles.emptyStateIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>money_off</span>
          </div>
          <h3 className={styles.emptyStateTitle}>No Disciplinary Penalties Found</h3>
          <p className={styles.emptyStateDesc}>
            {hasActiveFilters
              ? 'No records match your active search and filter criteria. Try adjusting or clearing your filters.'
              : 'There are currently no employee fines or disciplinary deductions recorded in the system.'}
          </p>
          {hasActiveFilters ? (
            <button onClick={handleResetFilters} className={styles.secondaryBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_alt_off</span>
              Clear Filters
            </button>
          ) : (
            <button onClick={() => setShowModal(true)} className={styles.primaryBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>gavel</span>
              Assign First Penalty
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className={styles.tableCard}>
          <table className={styles.dataTable}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.tableHeaderCell}>Date</th>
                <th className={styles.tableHeaderCell}>Employee</th>
                <th className={styles.tableHeaderCell}>Violation / Reason</th>
                <th className={styles.tableHeaderCell}>Fine Amount</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell}>Payroll Period</th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFines.map(f => {
                const emp = f.employee || employeeMap.get(f.employeeId);
                const firstName = emp?.firstName || 'Unknown';
                const lastName = emp?.lastName || '';
                const empCode = emp?.employeeId || f.employeeId.slice(0, 8);
                const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'EM';
                const isPending = f.status === 'PENDING';
                const isDeducted = f.status === 'DEDUCTED';
                const isCancelled = f.status === 'CANCELLED';
                const isActionBusy = actionLoading === f.id;
                const periodName = f.payrollRun?.period?.name;

                return (
                  <tr key={f.id} className={styles.tableRow}>
                    {/* Date */}
                    <td className={styles.tableCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                          calendar_today
                        </span>
                        <span style={{ fontSize: '13px' }}>{formatDate(f.date)}</span>
                      </div>
                    </td>

                    {/* Employee */}
                    <td className={styles.tableCell}>
                      <div className={styles.employeeProfileGroup}>
                        <div className={styles.empAvatar}>{initials}</div>
                        <div className={styles.empDetailsGroup}>
                          <span className={styles.empName}>{firstName} {lastName}</span>
                          <span className={styles.empIdBadge}>#{empCode}</span>
                        </div>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className={styles.tableCell}>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                        {f.reason}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className={styles.tableCell}>
                      <span className={styles.amountBadge}>{formatBDT(f.amount)}</span>
                    </td>

                    {/* Status */}
                    <td className={styles.tableCell}>
                      <span className={`${styles.statusChip} ${getStatusChipClass(f.status)}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          {isDeducted ? 'check_circle' : isPending ? 'schedule' : 'block'}
                        </span>
                        {f.status}
                      </span>
                    </td>

                    {/* Payroll Period */}
                    <td className={styles.tableCell}>
                      {periodName ? (
                        <span className={styles.periodBadge}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#059669' }}>
                            receipt_long
                          </span>
                          {periodName}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                      <div className={styles.actionBtnGroup} style={{ justifyContent: 'flex-end' }}>
                        {isPending && (
                          <button
                            onClick={() => handleUpdateStatus(f.id, 'CANCELLED')}
                            disabled={isActionBusy}
                            className={styles.waiveBtn}
                            title="Waive / Cancel Penalty"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>do_not_disturb</span>
                            {isActionBusy ? '...' : 'Waive'}
                          </button>
                        )}

                        {isCancelled && (
                          <button
                            onClick={() => handleUpdateStatus(f.id, 'PENDING')}
                            disabled={isActionBusy}
                            className={styles.reinstateBtn}
                            title="Reinstate to Pending"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>restart_alt</span>
                            {isActionBusy ? '...' : 'Reinstate'}
                          </button>
                        )}

                        {!isDeducted && (
                          <button
                            onClick={() => handleDeleteFine(f.id)}
                            disabled={isActionBusy}
                            className={styles.waiveBtn}
                            title="Delete Permanently"
                            style={{ opacity: 0.7 }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                          </button>
                        )}

                        {isDeducted && (
                          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>lock</span>
                            Settled
                          </span>
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
          {filteredFines.map(f => {
            const emp = f.employee || employeeMap.get(f.employeeId);
            const firstName = emp?.firstName || 'Unknown';
            const lastName = emp?.lastName || '';
            const empCode = emp?.employeeId || f.employeeId.slice(0, 8);
            const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'EM';
            const isPending = f.status === 'PENDING';
            const isDeducted = f.status === 'DEDUCTED';
            const isCancelled = f.status === 'CANCELLED';
            const isActionBusy = actionLoading === f.id;
            const periodName = f.payrollRun?.period?.name;

            return (
              <div key={f.id} className={styles.fineCard}>
                {/* Header */}
                <div className={styles.cardTopRow}>
                  <div className={styles.employeeProfileGroup}>
                    <div className={styles.empAvatar}>{initials}</div>
                    <div className={styles.empDetailsGroup}>
                      <span className={styles.empName}>{firstName} {lastName}</span>
                      <span className={styles.empIdBadge}>#{empCode}</span>
                    </div>
                  </div>

                  <span className={`${styles.statusChip} ${getStatusChipClass(f.status)}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      {isDeducted ? 'check_circle' : isPending ? 'schedule' : 'block'}
                    </span>
                    {f.status}
                  </span>
                </div>

                {/* Amount and Date Box */}
                <div className={styles.cardAmountBox}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                      Penalty Amount
                    </span>
                    <span className={styles.amountBadge} style={{ fontSize: '18px' }}>
                      {formatBDT(f.amount)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assigned Date</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {formatDate(f.date)}
                    </span>
                  </div>
                </div>

                {/* Reason Quote */}
                <div className={styles.cardReasonBox}>
                  &ldquo;{f.reason}&rdquo;
                </div>

                {/* Footer and Actions */}
                <div className={styles.cardFooter}>
                  <div>
                    {periodName ? (
                      <span className={styles.periodBadge} style={{ fontSize: '11px', padding: '2px 6px' }}>
                        {periodName}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unassigned period</span>
                    )}
                  </div>

                  <div className={styles.actionBtnGroup}>
                    {isPending && (
                      <button
                        onClick={() => handleUpdateStatus(f.id, 'CANCELLED')}
                        disabled={isActionBusy}
                        className={styles.waiveBtn}
                        title="Waive Penalty"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>do_not_disturb</span>
                        Waive
                      </button>
                    )}

                    {isCancelled && (
                      <button
                        onClick={() => handleUpdateStatus(f.id, 'PENDING')}
                        disabled={isActionBusy}
                        className={styles.reinstateBtn}
                        title="Reinstate to Pending"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>restart_alt</span>
                        Reinstate
                      </button>
                    )}

                    {!isDeducted && (
                      <button
                        onClick={() => handleDeleteFine(f.id)}
                        disabled={isActionBusy}
                        className={styles.waiveBtn}
                        title="Delete Permanently"
                        style={{ padding: '5px 7px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                      </button>
                    )}

                    {isDeducted && (
                      <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
                        Settled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Assign Penalty Modal */}
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
                <div className={styles.kpiIconBox} style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>gavel</span>
                </div>
                <h2 className={styles.modalTitle}>Assign Disciplinary Penalty</h2>
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

            <form onSubmit={handleCreateFine} className={styles.formGrid}>
              {/* Employee Selection */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Employee *</label>
                <select
                  value={newFine.employeeId}
                  onChange={e => setNewFine({ ...newFine, employeeId: e.target.value })}
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

              {/* Penalty Amount with Presets */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Penalty Amount (BDT ৳) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 500.00"
                  value={newFine.amount}
                  onChange={e => setNewFine({ ...newFine, amount: e.target.value })}
                  required
                  className={styles.formInput}
                />
                <div className={styles.presetGroup}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick fill:</span>
                  {AMOUNT_PRESETS.map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setNewFine({ ...newFine, amount: String(val) })}
                      className={styles.presetBtn}
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Violation Reason with Suggestions */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Violation / Justification *</label>
                <input
                  type="text"
                  placeholder="e.g. Late Arrival, Property Damage, Policy Non-Compliance"
                  value={newFine.reason}
                  onChange={e => setNewFine({ ...newFine, reason: e.target.value })}
                  required
                  className={styles.formInput}
                />
                <div className={styles.presetGroup}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Templates:</span>
                  {REASON_SUGGESTIONS.slice(0, 3).map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setNewFine({ ...newFine, reason: sug })}
                      className={styles.presetBtn}
                    >
                      {sug.split(' ')[0]} {sug.split(' ')[1] || ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Penalty Date */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Incident / Penalty Date *</label>
                <input
                  type="date"
                  value={newFine.date}
                  onChange={e => setNewFine({ ...newFine, date: e.target.value })}
                  required
                  className={styles.formInput}
                />
              </div>

              {/* Modal Actions */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.secondaryBtn}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={isSubmitting}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {isSubmitting ? 'hourglass_empty' : 'gavel'}
                  </span>
                  {isSubmitting ? 'Assigning...' : 'Assign Penalty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
