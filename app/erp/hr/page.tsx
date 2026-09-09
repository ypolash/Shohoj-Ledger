"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import styles from './hr.module.css';

interface Employee {
  id: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  departmentId?: string;
  basicSalary?: number | string;
  status?: string;
  createdAt?: string;
}

interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  _count?: { employees?: number };
}

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  createdAt: string;
  employee?: {
    firstName?: string;
    lastName?: string;
    designation?: string;
  };
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
}

/**
 * HR & Payroll Command Center Dashboard
 * Next-generation operational telemetry for workforce management,
 * department distribution, real-time attendance, leave workflow, and payroll readiness.
 */
export default function HRDashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [onboardingMode, setOnboardingMode] = useState<'BASIC' | 'PROFESSIONAL'>('PROFESSIONAL');

  const loadAll = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    else setIsLoading(true);

    try {
      const [empRes, deptRes, leaveRes, attRes, onboardingRes] = await Promise.all([
        fetch('/api/employees').catch(() => null),
        fetch('/api/departments').catch(() => null),
        fetch('/api/leaves').catch(() => null),
        fetch('/api/attendance').catch(() => null),
        fetch('/api/settings/onboarding').catch(() => null),
      ]);

      if (empRes && empRes.ok) {
        const empData = await empRes.json();
        setEmployees(Array.isArray(empData) ? empData : []);
      }
      if (deptRes && deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(Array.isArray(deptData) ? deptData : []);
      }
      if (leaveRes && leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setLeaves(Array.isArray(leaveData) ? leaveData : []);
      }
      if (attRes && attRes.ok) {
        const attData = await attRes.json();
        setAttendances(Array.isArray(attData) ? attData : []);
      }
      if (onboardingRes && onboardingRes.ok) {
        const onboardingData = await onboardingRes.json();
        if (onboardingData?.mode) setOnboardingMode(onboardingData.mode);
      }

      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed to load HR dashboard metrics:', e);
    } finally {
      setIsLoading(false);
      if (isManual) setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Format currency helper
  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  // Derived Metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => (e.status || 'ACTIVE') === 'ACTIVE').length;
  const inactiveEmployees = totalEmployees - activeEmployees;

  // Monthly base payroll liability
  const totalMonthlyPayroll = useMemo(() => {
    return employees.reduce((sum, emp) => {
      const sal = Number(emp.basicSalary) || 0;
      return sum + sal;
    }, 0);
  }, [employees]);

  const avgSalary = totalEmployees > 0 ? Math.round(totalMonthlyPayroll / totalEmployees) : 0;

  // Attendance metrics for today
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttendances = attendances.filter(a => (a.date ? a.date.slice(0, 10) === todayStr : false));
  const presentCount = todayAttendances.filter(a => a.status === 'PRESENT').length;
  const lateCount = todayAttendances.filter(a => a.status === 'LATE').length;
  const onLeaveCount = todayAttendances.filter(a => a.status === 'ON_LEAVE').length;
  const absentCount = Math.max(0, totalEmployees - (presentCount + lateCount + onLeaveCount));

  const attendanceRate = totalEmployees > 0 
    ? Math.round(((presentCount + lateCount) / totalEmployees) * 100) 
    : 100;

  // Leaves metrics
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING');
  const approvedLeaves = leaves.filter(l => l.status === 'APPROVED');
  const rejectedLeaves = leaves.filter(l => l.status === 'REJECTED');

  const filteredLeaves = useMemo(() => {
    if (activeTab === 'PENDING') return pendingLeaves;
    if (activeTab === 'APPROVED') return approvedLeaves;
    if (activeTab === 'REJECTED') return rejectedLeaves;
    return leaves;
  }, [activeTab, leaves, pendingLeaves, approvedLeaves, rejectedLeaves]);

  // Handle inline Leave Approval/Rejection
  const handleLeaveStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setLeaves(prev =>
          prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error('Failed to update leave request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Helper for department icon
  const getDeptIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('eng') || lower.includes('dev') || lower.includes('tech')) return 'terminal';
    if (lower.includes('hr') || lower.includes('human') || lower.includes('admin')) return 'badge';
    if (lower.includes('fin') || lower.includes('acc')) return 'account_balance';
    if (lower.includes('market') || lower.includes('sale')) return 'campaign';
    if (lower.includes('oper')) return 'settings_suggest';
    return 'corporate_fare';
  };

  // Current date formatting
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className={styles.container}>
      {/* 1. Executive Command Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTopRow}>
          <div className={styles.titleGroup}>
            <div className={styles.liveBadgeRow}>
              <div className={styles.livePulseDot} />
              <span className={styles.liveBadgeText}>HR Operations Live • Telemetry Sync</span>
            </div>
            <h1 className={styles.pageTitle}>
              HR & Payroll Command Center
              <span className={styles.statusChip}>Enterprise Hub</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Workforce telemetry, department staffing distributions, live attendance, leave approvals, and payroll readiness.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link href="/erp/hr/employees" className={styles.primaryBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
              Add Employee
            </Link>

            <Link href="/erp/hr/attendance" className={styles.secondaryBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>fact_check</span>
              Record Attendance
            </Link>

            <button
              onClick={() => loadAll(true)}
              className={styles.syncBtn}
              disabled={isSyncing}
              title="Refresh Live Metrics"
            >
              <span
                className={`material-symbols-outlined ${isSyncing ? styles.spinning : ''}`}
                style={{ fontSize: '18px' }}
              >
                refresh
              </span>
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Active Data Intake System Indicator & Settings Router */}
      <Link
        href="/erp/settings/onboarding"
        style={{ textDecoration: 'none' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            padding: '16px 24px',
            borderRadius: '18px',
            background: onboardingMode === 'BASIC'
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)'
              : 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.02) 100%)',
            border: onboardingMode === 'BASIC'
              ? '1.5px solid rgba(245, 158, 11, 0.3)'
              : '1.5px solid rgba(37, 99, 235, 0.3)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          className="hover-lift"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: onboardingMode === 'BASIC' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(37, 99, 235, 0.18)',
                color: onboardingMode === 'BASIC' ? '#f59e0b' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
                {onboardingMode === 'BASIC' ? 'bolt' : 'workspace_premium'}
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                  Select your active data intake system:
                </span>
                
                {/* Active Indicator Badge */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: onboardingMode === 'BASIC' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#ffffff',
                    boxShadow: onboardingMode === 'BASIC' ? '0 2px 10px rgba(245, 158, 11, 0.4)' : '0 2px 10px rgba(37, 99, 235, 0.4)',
                    letterSpacing: '0.01em'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    {onboardingMode === 'BASIC' ? 'bolt' : 'workspace_premium'}
                  </span>
                  <span>{onboardingMode === 'BASIC' ? 'Basic Mode (7 Fields Active)' : 'Professional Mode (Enterprise Dossier Active)'}</span>
                </span>
              </div>

              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {onboardingMode === 'BASIC'
                  ? 'Collecting 7 minimal fields: Full Name, Phone, Email, Address, Salary, Join Date, Staff PIN. Click to switch or configure in Settings.'
                  : 'Collecting complete enterprise records: Personal, Demographics, Education, Experience, Banking, Nominees. Click to switch or configure in Settings.'}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '12px',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-main)',
              color: onboardingMode === 'BASIC' ? '#d97706' : 'var(--primary)',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <span>Configure in Settings</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
          </div>
        </div>
      </Link>


      {/* 3. Operational KPI Metrics Grid */}
      <section className={styles.kpiGrid}>
        {/* Total Workforce */}
        <div className={`${styles.kpiCard} ${styles.kpiGlowBlue}`}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>groups</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check_circle</span>
              {activeEmployees} Active
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Workforce</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '32px', width: '60px' }} /> : totalEmployees}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>All Registered Staff</span>
            <span>{inactiveEmployees} Inactive</span>
          </div>
        </div>

        {/* Today's Attendance Pulse */}
        <div className={`${styles.kpiCard} ${styles.kpiGlowGreen}`}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>how_to_reg</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
              {attendanceRate}% On Duty
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Attendance Today</span>
            <div className={styles.kpiValue}>
              {isLoading ? (
                <div className={styles.skeleton} style={{ height: '32px', width: '60px' }} />
              ) : (
                `${presentCount + lateCount}`
              )}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>{presentCount} On Time · {lateCount} Late</span>
            <span>{absentCount} Absent</span>
          </div>
        </div>

        {/* Operational Departments */}
        <div className={`${styles.kpiCard} ${styles.kpiGlowPurple}`}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>corporate_fare</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>domain</span>
              Allocated
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Departments</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '32px', width: '60px' }} /> : departments.length}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Cross-Functional Teams</span>
            <Link href="/erp/hr/departments" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              View →
            </Link>
          </div>
        </div>

        {/* Pending Leave Inquiries */}
        <div className={`${styles.kpiCard} ${styles.kpiGlowAmber}`}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>event_busy</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${pendingLeaves.length > 0 ? styles.trendWarning : styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                {pendingLeaves.length > 0 ? 'warning' : 'done_all'}
              </span>
              {pendingLeaves.length > 0 ? 'Requires Action' : 'Queue Clear'}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Pending Leaves</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '32px', width: '60px' }} /> : pendingLeaves.length}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>{approvedLeaves.length} Approved this period</span>
            <Link href="/erp/hr/leaves" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Review →
            </Link>
          </div>
        </div>

        {/* Monthly Base Payroll Commitment */}
        <div className={`${styles.kpiCard} ${styles.kpiGlowCyan}`}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>account_balance_wallet</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>calendar_month</span>
              Monthly
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Monthly Payroll Est.</span>
            <div className={styles.kpiValue} style={{ fontSize: '22px' }}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '32px', width: '120px' }} /> : formatCurrency(totalMonthlyPayroll)}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Active Salary Liability</span>
            <span>Avg: {formatCurrency(avgSalary)}</span>
          </div>
        </div>

        {/* Compliance & Health */}
        <div className={`${styles.kpiCard} ${styles.kpiGlowRose}`}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>shield</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
              Compliant
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Workforce Health</span>
            <div className={styles.kpiValue}>100%</div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Sanctions & Deductions: 0</span>
            <Link href="/erp/hr/fines" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Audit →
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Two-Column Interactive Command Grid */}
      <div className={styles.commandGrid}>
        {/* Main Operational Column (65%) */}
        <div className={styles.mainColumn}>
          {/* Department Staffing & Allocation Visualizer */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <h2 className={styles.sectionTitle}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>lan</span>
                  Department Staffing Allocation
                </h2>
                <p className={styles.sectionSubtitle}>
                  Capacity and headcount distribution across operational units
                </p>
              </div>
              <Link href="/erp/hr/departments" className={styles.cardHeaderAction}>
                Manage Departments
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </Link>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className={styles.skeleton} style={{ height: '60px', borderRadius: '12px' }} />
                ))}
              </div>
            ) : departments.length === 0 ? (
              <div className={styles.emptyStateBox}>
                <div className={styles.emptyStateIcon}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>domain_disabled</span>
                </div>
                <h3 className={styles.emptyStateTitle}>No Departments Found</h3>
                <p className={styles.emptyStateDesc}>Configure departments to begin organizing staff allocations.</p>
                <Link href="/erp/hr/departments" className={styles.primaryBtn} style={{ marginTop: '8px' }}>
                  Create Department
                </Link>
              </div>
            ) : (
              <div className={styles.deptGrid}>
                {departments.map((dept) => {
                  // Calculate employees assigned to this department
                  const count = dept._count?.employees ?? 
                    employees.filter(e => e.department === dept.name || e.departmentId === dept.id).length;
                  const pct = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;

                  return (
                    <div key={dept.id} className={styles.deptItemCard}>
                      <div className={styles.deptHeader}>
                        <div className={styles.deptIconTitle}>
                          <div className={styles.deptIcon}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                              {getDeptIcon(dept.name)}
                            </span>
                          </div>
                          <span className={styles.deptName}>{dept.name}</span>
                        </div>
                        {dept.code && <span className={styles.deptCodeBadge}>{dept.code}</span>}
                      </div>

                      <div className={styles.deptMetrics}>
                        <span className={styles.deptEmpCount}>{count} Personnel</span>
                        <span>{pct}% of workforce</span>
                      </div>

                      <div className={styles.deptProgressBar}>
                        <div
                          className={styles.deptProgressFill}
                          style={{ width: `${Math.max(pct, totalEmployees === 0 ? 0 : 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leave & Absence Management Hub */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <h2 className={styles.sectionTitle}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--warning)' }}>event_note</span>
                  Leave & Absence Management Hub
                </h2>
                <p className={styles.sectionSubtitle}>
                  Review staff time-off requests, manage vacation cycles, and audit approvals
                </p>
              </div>

              <Link href="/erp/hr/leaves" className={styles.cardHeaderAction}>
                Leave Operations
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </Link>
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabsRow}>
              <div className={styles.tabsList}>
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`${styles.tabBtn} ${activeTab === 'ALL' ? styles.tabBtnActive : ''}`}
                >
                  All Requests
                  <span className={styles.tabCountBadge}>{leaves.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab('PENDING')}
                  className={`${styles.tabBtn} ${activeTab === 'PENDING' ? styles.tabBtnActive : ''}`}
                >
                  Pending
                  <span
                    className={styles.tabCountBadge}
                    style={{ background: pendingLeaves.length > 0 ? 'rgba(245, 158, 11, 0.2)' : undefined, color: pendingLeaves.length > 0 ? '#d97706' : undefined }}
                  >
                    {pendingLeaves.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('APPROVED')}
                  className={`${styles.tabBtn} ${activeTab === 'APPROVED' ? styles.tabBtnActive : ''}`}
                >
                  Approved
                  <span className={styles.tabCountBadge}>{approvedLeaves.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab('REJECTED')}
                  className={`${styles.tabBtn} ${activeTab === 'REJECTED' ? styles.tabBtnActive : ''}`}
                >
                  Rejected
                  <span className={styles.tabCountBadge}>{rejectedLeaves.length}</span>
                </button>
              </div>

              <Link href="/erp/hr/leaves" className={styles.secondaryBtn} style={{ padding: '6px 12px', fontSize: '12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                Apply Leave
              </Link>
            </div>

            {/* Leave Items List */}
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className={styles.skeleton} style={{ height: '64px', borderRadius: '12px' }} />
                ))}
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className={styles.emptyStateBox}>
                <div className={styles.emptyStateIcon}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>event_available</span>
                </div>
                <h3 className={styles.emptyStateTitle}>
                  {activeTab === 'ALL'
                    ? 'No Leave Requests on Record'
                    : `No ${activeTab.toLowerCase()} Leave Requests`}
                </h3>
                <p className={styles.emptyStateDesc}>
                  {activeTab === 'PENDING'
                    ? 'There are currently no pending leave requests awaiting approval.'
                    : 'Employees can submit leave requests from their portal or via the Leave Management module.'}
                </p>
                <Link href="/erp/hr/leaves" className={styles.primaryBtn} style={{ marginTop: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                  Create Leave Request
                </Link>
              </div>
            ) : (
              <div className={styles.leavesList}>
                {filteredLeaves.slice(0, 8).map((leave) => {
                  const empName = leave.employee
                    ? `${leave.employee.firstName || ''} ${leave.employee.lastName || ''}`.trim()
                    : 'Staff Member';
                  const initials = empName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'HR';

                  const start = new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const end = new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <div key={leave.id} className={styles.leaveItemRow}>
                      <div className={styles.leaveEmployeeInfo}>
                        <div className={styles.empAvatar}>{initials}</div>
                        <div className={styles.empDetails}>
                          <span className={styles.empName}>{empName}</span>
                          <span className={styles.empDesignation}>
                            {leave.employee?.designation || 'Staff Personnel'}
                          </span>
                        </div>
                      </div>

                      <div className={styles.leaveDetailsGroup}>
                        <span className={styles.leaveTypeBadge}>{leave.type}</span>
                        <div className={styles.leaveDates}>
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>calendar_today</span>
                          <span>{start} – {end}</span>
                        </div>
                        {leave.reason && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            &ldquo;{leave.reason}&rdquo;
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className={`${styles.leaveStatusChip} ${
                            leave.status === 'APPROVED'
                              ? styles.statusApproved
                              : leave.status === 'REJECTED'
                              ? styles.statusRejected
                              : styles.statusPending
                          }`}
                        >
                          {leave.status}
                        </span>

                        {leave.status === 'PENDING' && (
                          <div className={styles.leaveActionsGroup}>
                            <button
                              onClick={() => handleLeaveStatus(leave.id, 'APPROVED')}
                              disabled={actionLoading === leave.id}
                              className={styles.approveBtn}
                              title="Approve Request"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span>
                              Approve
                            </button>
                            <button
                              onClick={() => handleLeaveStatus(leave.id, 'REJECTED')}
                              disabled={actionLoading === leave.id}
                              className={styles.rejectBtn}
                              title="Reject Request"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Telemetry Column (35%) */}
        <div className={styles.sideColumn}>
          {/* Today's Attendance Gauge */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <h2 className={styles.sectionTitle}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--success)' }}>fact_check</span>
                  Today&apos;s Attendance Pulse
                </h2>
                <p className={styles.sectionSubtitle}>{todayFormatted}</p>
              </div>
            </div>

            <div className={styles.attendanceStatsList}>
              <div className={styles.attendanceStatRow}>
                <div className={styles.attendanceStatLabel}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }} />
                  <span>Present On Time</span>
                </div>
                <span className={styles.attendanceStatValue}>{presentCount} Staff</span>
              </div>

              <div className={styles.attendanceStatRow}>
                <div className={styles.attendanceStatLabel}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }} />
                  <span>Late Arrivals</span>
                </div>
                <span className={styles.attendanceStatValue}>{lateCount} Staff</span>
              </div>

              <div className={styles.attendanceStatRow}>
                <div className={styles.attendanceStatLabel}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />
                  <span>On Approved Leave</span>
                </div>
                <span className={styles.attendanceStatValue}>{onLeaveCount} Staff</span>
              </div>

              <div className={styles.attendanceStatRow}>
                <div className={styles.attendanceStatLabel}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                  <span>Absent / Unaccounted</span>
                </div>
                <span className={styles.attendanceStatValue}>{absentCount} Staff</span>
              </div>
            </div>

            <Link href="/erp/hr/attendance" className={styles.primaryBtn} style={{ justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>checklist</span>
              Open Attendance Terminal
            </Link>
          </div>

          {/* Payroll Cycle Snapshot */}
          <div className={styles.payrollBanner}>
            <div className={styles.payrollBannerTop}>
              <span className={styles.payrollMonthTag}>{currentMonthName}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Cycle Active</span>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                Total Salary Liability
              </span>
              <div className={styles.payrollAmount}>
                {formatCurrency(totalMonthlyPayroll)}
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Ready for processing based on registered staff basic salaries and active employee contracts.
            </p>

            <Link href="/erp/hr/payroll" className={styles.payrollActionLink}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>payments</span>
              Proceed to Payroll Engine →
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
