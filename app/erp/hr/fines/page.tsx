"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  department?: string;
  departmentRef?: { name: string };
  designationRef?: { name: string };
}

interface EmployeeFineSummary {
  employeeId: string;
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  totalCount: number;
  totalAmount: number;
  pendingAmount: number;
  deductedAmount: number;
  cancelledAmount: number;
  lateCount: number;
  otherCount: number;
  fines: EmployeeFine[];
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
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'LATE' | 'OTHER'>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPolicy, setShowPolicy] = useState(true);

  // Modal & Profile States
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');
  const [profileFilter, setProfileFilter] = useState<'PENALIZED' | 'PENDING' | 'DEDUCTED' | 'ALL'>('PENALIZED');
  const [profileSort, setProfileSort] = useState<'amount_desc' | 'amount_asc' | 'count_desc' | 'name_asc'>('amount_desc');
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);
  const [newFine, setNewFine] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

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

      // Category filter (Late Fines vs Other Disciplinary)
      const isLateViolation = reason.includes('late');
      if (typeFilter === 'LATE' && !isLateViolation) {
        return false;
      }
      if (typeFilter === 'OTHER' && isLateViolation) {
        return false;
      }

      // Employee filter
      if (employeeFilter !== 'ALL' && f.employeeId !== employeeFilter) {
        return false;
      }

      return true;
    });
  }, [fines, employeeMap, search, statusFilter, typeFilter, employeeFilter]);

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

  const lateFines = fines.filter(f => (f.reason || '').toLowerCase().includes('late'));
  const lateCount = lateFines.length;
  const otherCount = totalCount - lateCount;

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

  // Aggregate per-employee fine profiles
  const employeeSummaries = useMemo<EmployeeFineSummary[]>(() => {
    const map = new Map<string, EmployeeFineSummary>();

    employees.forEach(emp => {
      const designation = emp.designationRef?.name || emp.designation || 'Staff';
      const department = emp.departmentRef?.name || emp.department || 'General';
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown Staff';
      const code = emp.employeeId || emp.id.slice(0, 8);

      map.set(emp.id, {
        employeeId: emp.id,
        employeeCode: code,
        name: fullName,
        designation,
        department,
        totalCount: 0,
        totalAmount: 0,
        pendingAmount: 0,
        deductedAmount: 0,
        cancelledAmount: 0,
        lateCount: 0,
        otherCount: 0,
        fines: [],
      });
    });

    fines.forEach(f => {
      let summary = map.get(f.employeeId);
      if (!summary) {
        const emp = f.employee;
        const fullName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : `Employee #${f.employeeId.slice(0, 8)}`;
        const code = emp?.employeeId || f.employeeId.slice(0, 8);
        const designation = emp?.designation || 'Staff';

        summary = {
          employeeId: f.employeeId,
          employeeCode: code,
          name: fullName,
          designation,
          department: 'General',
          totalCount: 0,
          totalAmount: 0,
          pendingAmount: 0,
          deductedAmount: 0,
          cancelledAmount: 0,
          lateCount: 0,
          otherCount: 0,
          fines: [],
        };
        map.set(f.employeeId, summary);
      }

      const amt = Number(f.amount) || 0;
      summary.totalCount += 1;
      summary.totalAmount += amt;
      summary.fines.push(f);

      if (f.status === 'PENDING') {
        summary.pendingAmount += amt;
      } else if (f.status === 'DEDUCTED') {
        summary.deductedAmount += amt;
      } else if (f.status === 'CANCELLED') {
        summary.cancelledAmount += amt;
      }

      const isLate = (f.reason || '').toLowerCase().includes('late');
      if (isLate) {
        summary.lateCount += 1;
      } else {
        summary.otherCount += 1;
      }
    });

    return Array.from(map.values());
  }, [employees, fines]);

  const penalizedStaffList = useMemo(() => {
    return employeeSummaries.filter(e => e.totalCount > 0);
  }, [employeeSummaries]);

  const penalizedEmployeesCount = penalizedStaffList.length;

  const filteredSummaries = useMemo(() => {
    return employeeSummaries
      .filter(emp => {
        if (profileFilter === 'PENALIZED' && emp.totalCount === 0) return false;
        if (profileFilter === 'PENDING' && emp.pendingAmount === 0) return false;
        if (profileFilter === 'DEDUCTED' && emp.deductedAmount === 0) return false;

        if (profileSearch.trim()) {
          const q = profileSearch.toLowerCase();
          const match =
            emp.name.toLowerCase().includes(q) ||
            emp.employeeCode.toLowerCase().includes(q) ||
            emp.designation.toLowerCase().includes(q) ||
            emp.department.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (profileSort === 'amount_desc') return b.totalAmount - a.totalAmount;
        if (profileSort === 'amount_asc') return a.totalAmount - b.totalAmount;
        if (profileSort === 'count_desc') return b.totalCount - a.totalCount;
        if (profileSort === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [employeeSummaries, profileFilter, profileSearch, profileSort]);

  // Export Detailed Fines Log CSV
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

  // Export Employee Profiles Summary CSV
  const handleExportEmployeeProfilesCSV = (listToExport?: EmployeeFineSummary[]) => {
    const list = listToExport || employeeSummaries.filter(e => e.totalCount > 0);
    if (list.length === 0) {
      alert('No employee fine profiles available to export.');
      return;
    }
    const headers = [
      'Employee ID',
      'Employee Name',
      'Designation',
      'Department',
      'Total Penalties',
      'Total Fine Amount (BDT)',
      'Pending Amount (BDT)',
      'Deducted Amount (BDT)',
      'Waived Amount (BDT)',
      'Late Fines Count',
      'Other Fines Count',
    ];

    const rows = list.map(item => [
      item.employeeCode || '',
      item.name,
      item.designation || 'Staff',
      item.department || 'General',
      item.totalCount,
      item.totalAmount.toFixed(2),
      item.pendingAmount.toFixed(2),
      item.deductedAmount.toFixed(2),
      item.cancelledAmount.toFixed(2),
      item.lateCount,
      item.otherCount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employee_fines_profile_summary_${new Date().toISOString().slice(0, 10)}.csv`);
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
          <h1 className={styles.pageTitle}>
            Disciplinary Fines &amp; Deductions
            <span className={styles.titleBadge}>{totalCount} Penalties</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          {/* Export CSV with Dropdown Options */}
          <div className={styles.exportDropdownWrapper} ref={exportDropdownRef}>
            <button
              onClick={() => setShowExportMenu(prev => !prev)}
              className={styles.headerIconBtn}
              disabled={fines.length === 0}
              title="Export CSV &amp; Summary Options"
              aria-label="Export CSV Options"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
            </button>

            {showExportMenu && (
              <div className={styles.exportDropdownMenu}>
                <button
                  type="button"
                  onClick={() => {
                    handleExportCSV();
                    setShowExportMenu(false);
                  }}
                  className={styles.exportMenuItem}
                >
                  <div className={styles.exportMenuItemIcon} style={{ color: '#2563eb', background: 'rgba(37, 99, 235, 0.1)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span>
                  </div>
                  <div>
                    <div className={styles.exportMenuItemTitle}>Detailed Fines Log (.csv)</div>
                    <div className={styles.exportMenuItemDesc}>Export all individual penalty records with dates, reasons, and amounts.</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleExportEmployeeProfilesCSV();
                    setShowExportMenu(false);
                  }}
                  className={styles.exportMenuItem}
                >
                  <div className={styles.exportMenuItemIcon} style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>badge</span>
                  </div>
                  <div>
                    <div className={styles.exportMenuItemTitle}>Employee Fine Profiles (.csv)</div>
                    <div className={styles.exportMenuItemDesc}>Export per-employee totals showing how much fines each employee got.</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    setShowProfileModal(true);
                  }}
                  className={styles.exportMenuItem}
                  style={{ borderTop: '1px solid var(--border-main, #e2e8f0)', marginTop: '4px', paddingTop: '8px' }}
                >
                  <div className={styles.exportMenuItemIcon} style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>contacts</span>
                  </div>
                  <div>
                    <div className={styles.exportMenuItemTitle}>Open Employee Profiles View</div>
                    <div className={styles.exportMenuItemDesc}>View interactive breakdown modal of employee fines &amp; totals.</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Employee Fine Profiles Icon Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            className={`${styles.headerIconBtn} ${styles.headerIconBtnWithBadge}`}
            title="Employee Fine Profiles (How much fines each employee got)"
            aria-label="Employee Fine Profiles"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>badge</span>
            {penalizedEmployeesCount > 0 && (
              <span className={styles.headerIconBadge}>{penalizedEmployeesCount}</span>
            )}
          </button>

          <button
            onClick={() => fetchData(true)}
            className={styles.headerIconBtn}
            disabled={isSyncing}
            title="Refresh Fines"
            aria-label="Refresh Fines"
          >
            <span
              className={`material-symbols-outlined ${isSyncing ? styles.spinning : ''}`}
              style={{ fontSize: '20px' }}
            >
              refresh
            </span>
          </button>

          <button
            onClick={() => {
              setNewFine(EMPTY_FORM);
              setError('');
              setShowModal(true);
            }}
            className={`${styles.headerIconBtn} ${styles.headerIconBtnPrimary}`}
            title="Assign Penalty"
            aria-label="Assign Penalty"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>gavel</span>
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
          {/* Category & Status Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {/* Category Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
                Type:
              </span>
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: typeFilter === 'ALL' ? '1px solid #2563eb' : '1px solid var(--border-main, #e2e8f0)',
                  background: typeFilter === 'ALL' ? '#2563eb' : 'var(--surface-card, #ffffff)',
                  color: typeFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary, #475569)',
                  transition: 'all 0.15s ease',
                }}
              >
                All Fines ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('LATE')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: typeFilter === 'LATE' ? '1px solid #d97706' : '1px solid var(--border-main, #e2e8f0)',
                  background: typeFilter === 'LATE' ? '#f59e0b' : 'var(--surface-card, #ffffff)',
                  color: typeFilter === 'LATE' ? '#ffffff' : 'var(--text-secondary, #475569)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                Late Arrival Fines ({lateCount})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('OTHER')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: typeFilter === 'OTHER' ? '1px solid #64748b' : '1px solid var(--border-main, #e2e8f0)',
                  background: typeFilter === 'OTHER' ? '#64748b' : 'var(--surface-card, #ffffff)',
                  color: typeFilter === 'OTHER' ? '#ffffff' : 'var(--text-secondary, #475569)',
                  transition: 'all 0.15s ease',
                }}
              >
                Other Penalties ({otherCount})
              </button>
            </div>

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
                      <div
                        className={`${styles.employeeProfileGroup} ${styles.clickableProfile}`}
                        onClick={() => {
                          setProfileSearch(emp?.firstName || '');
                          setProfileFilter('ALL');
                          setExpandedEmpId(f.employeeId);
                          setShowProfileModal(true);
                        }}
                        title="Click to view employee fine profile &amp; summary"
                      >
                        <div className={styles.empAvatar}>{initials}</div>
                        <div className={styles.empDetailsGroup}>
                          <span className={styles.empName}>{firstName} {lastName}</span>
                          <span className={styles.empIdBadge}>#{empCode}</span>
                        </div>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className={styles.tableCell}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {f.reason?.toLowerCase().includes('late') && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#b45309',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            width: 'fit-content',
                            letterSpacing: '0.02em',
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>schedule</span>
                            Late Fine
                          </span>
                        )}
                        <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '13px' }}>
                          {f.reason}
                        </span>
                      </div>
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
                  <div
                    className={`${styles.employeeProfileGroup} ${styles.clickableProfile}`}
                    onClick={() => {
                      setProfileSearch(emp?.firstName || '');
                      setProfileFilter('ALL');
                      setExpandedEmpId(f.employeeId);
                      setShowProfileModal(true);
                    }}
                    title="Click to view employee fine profile &amp; summary"
                  >
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
                  {f.reason?.toLowerCase().includes('late') && (
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(245, 158, 11, 0.12)',
                        color: '#b45309',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        letterSpacing: '0.02em',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>schedule</span>
                        Late Fine
                      </span>
                    </div>
                  )}
                  <div>&ldquo;{f.reason}&rdquo;</div>
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

      {/* 7. Employee Fine Profiles & Totals Modal */}
      {showProfileModal && (
        <div
          className={styles.modalBackdrop}
          onClick={e => {
            if (e.target === e.currentTarget) setShowProfileModal(false);
          }}
        >
          <div className={styles.modalBoxLarge}>
            {/* Modal Header */}
            <div className={styles.modalHeaderLarge}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  className={styles.kpiIconBox}
                  style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e', width: '44px', height: '44px', borderRadius: '12px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>badge</span>
                </div>
                <div>
                  <h2 className={styles.modalTitle} style={{ fontSize: '19px' }}>
                    Employee Disciplinary Profiles &amp; Fine Totals
                  </h2>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Showing cumulative penalties &amp; deduction breakdown across {penalizedEmployeesCount} staff members
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Export CSV inside Modal */}
                <button
                  type="button"
                  onClick={() => handleExportEmployeeProfilesCSV(filteredSummaries)}
                  className={styles.secondaryBtn}
                  disabled={filteredSummaries.length === 0}
                  title="Export this employee summary as CSV"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                  Export CSV ({filteredSummaries.length})
                </button>

                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className={styles.modalCloseBtn}
                  title="Close modal"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className={styles.modalLargeBody}>
              {/* Profile KPI Stat Grid */}
              <div className={styles.profileStatsGrid}>
                <div className={styles.profileStatCard}>
                  <span className={styles.profileStatLabel}>Penalized Employees</span>
                  <span className={styles.profileStatValue} style={{ color: '#f43f5e' }}>
                    {penalizedEmployeesCount} <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>/ {employees.length} staff</span>
                  </span>
                </div>

                <div className={styles.profileStatCard}>
                  <span className={styles.profileStatLabel}>Total Fines Incurred</span>
                  <span className={styles.profileStatValue} style={{ color: 'var(--text-main)' }}>
                    {formatBDT(totalGrossAmount)}
                  </span>
                </div>

                <div className={styles.profileStatCard}>
                  <span className={styles.profileStatLabel}>Settled / Deducted</span>
                  <span className={styles.profileStatValue} style={{ color: '#059669' }}>
                    {formatBDT(deductedAmount)}
                  </span>
                </div>

                <div className={styles.profileStatCard}>
                  <span className={styles.profileStatLabel}>Pending Deductions</span>
                  <span className={styles.profileStatValue} style={{ color: '#f59e0b' }}>
                    {formatBDT(pendingAmount)}
                  </span>
                </div>
              </div>

              {/* Controls Bar: Search, Filter Tabs, Sort */}
              <div className={styles.profileControlsRow}>
                {/* Search */}
                <div className={styles.searchWrapper} style={{ flex: '1 1 240px', minWidth: '220px' }}>
                  <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
                  <input
                    type="text"
                    placeholder="Search employee by name, ID, or title..."
                    value={profileSearch}
                    onChange={e => setProfileSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                  {profileSearch && (
                    <button onClick={() => setProfileSearch('')} className={styles.clearSearchBtn} title="Clear search">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setProfileFilter('PENALIZED')}
                    className={`${styles.statusTabBtn} ${profileFilter === 'PENALIZED' ? styles.statusTabBtnActive : ''}`}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Penalized ({penalizedEmployeesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileFilter('PENDING')}
                    className={`${styles.statusTabBtn} ${profileFilter === 'PENDING' ? styles.statusTabBtnActive : ''}`}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Pending ({employeeSummaries.filter(e => e.pendingAmount > 0).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileFilter('DEDUCTED')}
                    className={`${styles.statusTabBtn} ${profileFilter === 'DEDUCTED' ? styles.statusTabBtnActive : ''}`}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Deducted ({employeeSummaries.filter(e => e.deductedAmount > 0).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileFilter('ALL')}
                    className={`${styles.statusTabBtn} ${profileFilter === 'ALL' ? styles.statusTabBtnActive : ''}`}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    All Staff ({employeeSummaries.length})
                  </button>
                </div>

                {/* Sort dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Sort:
                  </span>
                  <select
                    value={profileSort}
                    onChange={e => setProfileSort(e.target.value as any)}
                    className={styles.selectDropdown}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <option value="amount_desc">Highest Fines (৳)</option>
                    <option value="amount_asc">Lowest Fines (৳)</option>
                    <option value="count_desc">Most Penalties</option>
                    <option value="name_asc">Employee Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Employee Summaries List */}
              {filteredSummaries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '36px', opacity: 0.5, marginBottom: '8px', display: 'block' }}>
                    person_search
                  </span>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>No matching employees found</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Try clearing your search keyword or switching filter tabs.</div>
                </div>
              ) : (
                <div className={styles.profileCardsList}>
                  {filteredSummaries.map(emp => {
                    const initials = emp.name
                      .split(' ')
                      .map(p => p[0] || '')
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'EM';
                    const isExpanded = expandedEmpId === emp.employeeId;

                    return (
                      <div key={emp.employeeId} className={styles.summaryEmpCard}>
                        {/* Top row */}
                        <div className={styles.summaryEmpMainRow}>
                          {/* Employee info */}
                          <div className={styles.employeeProfileGroup}>
                            <div className={styles.empAvatar} style={{ width: '42px', height: '42px', fontSize: '14px' }}>
                              {initials}
                            </div>
                            <div className={styles.empDetailsGroup}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={styles.empName} style={{ fontSize: '15px' }}>{emp.name}</span>
                                <span className={styles.empIdBadge}>#{emp.employeeCode}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {emp.designation} {emp.department ? `· ${emp.department}` : ''}
                              </div>
                            </div>
                          </div>

                          {/* Amount and Penalty Count */}
                          <div className={styles.summaryAmountGroup}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                                Total Fines
                              </span>
                              <span className={styles.amountBadge} style={{ fontSize: '18px' }}>
                                {formatBDT(emp.totalAmount)}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: emp.totalCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--surface-hover)',
                                  color: emp.totalCount > 0 ? '#e11d48' : 'var(--text-muted)',
                                }}
                              >
                                {emp.totalCount} {emp.totalCount === 1 ? 'Penalty' : 'Penalties'}
                              </span>

                              {emp.totalCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedEmpId(isExpanded ? null : emp.employeeId)}
                                  className={styles.secondaryBtn}
                                  style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '8px' }}
                                  title="Toggle fine history"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                    {isExpanded ? 'expand_less' : 'expand_more'}
                                  </span>
                                  {isExpanded ? 'Hide History' : 'View History'}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEmployeeFilter(emp.employeeId);
                                  setShowProfileModal(false);
                                }}
                                className={styles.secondaryBtn}
                                style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '8px' }}
                                title="Filter main page by this employee"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>filter_list</span>
                                Filter
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Breakdown pills row */}
                        <div className={styles.summaryBreakdownPills}>
                          <span
                            className={styles.summaryPill}
                            style={{
                              background: emp.pendingAmount > 0 ? 'rgba(245, 158, 11, 0.12)' : 'var(--surface-hover)',
                              color: emp.pendingAmount > 0 ? '#b45309' : 'var(--text-muted)',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>schedule</span>
                            Pending: {formatBDT(emp.pendingAmount)}
                          </span>

                          <span
                            className={styles.summaryPill}
                            style={{
                              background: emp.deductedAmount > 0 ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-hover)',
                              color: emp.deductedAmount > 0 ? '#059669' : 'var(--text-muted)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check_circle</span>
                            Deducted: {formatBDT(emp.deductedAmount)}
                          </span>

                          {emp.cancelledAmount > 0 && (
                            <span
                              className={styles.summaryPill}
                              style={{
                                background: 'rgba(100, 116, 139, 0.12)',
                                color: '#64748b',
                                border: '1px solid rgba(100, 116, 139, 0.25)',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>block</span>
                              Waived: {formatBDT(emp.cancelledAmount)}
                            </span>
                          )}

                          {emp.lateCount > 0 && (
                            <span
                              className={styles.summaryPill}
                              style={{
                                background: 'rgba(99, 102, 241, 0.08)',
                                color: '#6366f1',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>alarm</span>
                              {emp.lateCount} Late Fines
                            </span>
                          )}
                        </div>

                        {/* Expandable fine history table */}
                        {isExpanded && (
                          <div className={styles.summaryHistoryBox}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                              Penalty History for {emp.name} ({emp.fines.length} records):
                            </div>
                            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-main)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                  <th style={{ padding: '6px 8px' }}>Date</th>
                                  <th style={{ padding: '6px 8px' }}>Violation Reason</th>
                                  <th style={{ padding: '6px 8px' }}>Amount</th>
                                  <th style={{ padding: '6px 8px' }}>Status</th>
                                  <th style={{ padding: '6px 8px' }}>Payroll Period</th>
                                </tr>
                              </thead>
                              <tbody>
                                {emp.fines.map(item => (
                                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                                    <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>
                                      {formatDate(item.date)}
                                    </td>
                                    <td style={{ padding: '6px 8px', fontWeight: 500 }}>
                                      {item.reason}
                                    </td>
                                    <td style={{ padding: '6px 8px', fontWeight: 700, color: 'var(--danger)' }}>
                                      {formatBDT(item.amount)}
                                    </td>
                                    <td style={{ padding: '6px 8px' }}>
                                      <span className={`${styles.statusChip} ${getStatusChipClass(item.status)}`} style={{ padding: '2px 8px', fontSize: '10px' }}>
                                        {item.status}
                                      </span>
                                    </td>
                                    <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>
                                      {item.payrollRun?.period?.name || '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
