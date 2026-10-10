"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './review.module.css';

interface PayrollAuditReviewData {
  payment: {
    id: string;
    month: number;
    year: number;
    basicSalary: number;
    grossSalary: number;
    netSalary: number;
    status: string;
    paymentMethod?: string;
    paymentDate?: string;
    transactionRef?: string;
    paymentNote?: string;
    createdAt: string;
    employee: {
      id: string;
      firstName: string;
      lastName: string;
      employeeId: string;
      email?: string;
      phone?: string;
      address?: string;
      department?: string;
      designation?: string;
      departmentRef?: { name: string };
      designationRef?: { name: string };
    };
  };
  telemetry: {
    totalAttendanceLogs: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    totalLateMinutes: number;
    totalPunishmentAmount: number;
    totalFineAmount: number;
    totalBonusAmount: number;
    totalTaskRewardAmount: number;
  };
  fines: Array<{
    id: string;
    amount: number | string;
    reason: string;
    date: string;
    status: string;
    createdAt?: string;
  }>;
  attendances: Array<{
    id: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: string;
    lateMinutes?: number;
    earlyLeaveMinutes?: number;
    punishmentAmount?: number | string;
    punishmentReason?: string;
  }>;
  absentRecords: Array<any>;
  lateRecords: Array<any>;
  leaves: Array<{
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
    status: string;
  }>;
  bonuses: Array<{
    id: string;
    title?: string;
    type: string;
    amount: number | string;
    reason?: string;
  }>;
  deductions: Array<{
    id: string;
    type: string;
    amount: number | string;
    reason?: string;
  }>;
  taskRewards: Array<{
    id: string;
    rewardAmount?: number;
    pointsAwarded?: number;
    reviewNotes?: string;
    createdAt: string;
    taskReward?: {
      title: string;
      description?: string;
    };
  }>;
  overtimes: Array<{
    id: string;
    hours: number;
    rate: number;
    status: string;
    attendance?: {
      date: string;
    };
  }>;
  salaryAdvances: Array<{
    id: string;
    amount: number | string;
    reason?: string;
    status: string;
    recoveries?: Array<{ amount: number | string; recoveryDate: string }>;
  }>;
  loans: Array<{
    id: string;
    principalAmount: number | string;
    outstandingBalance: number | string;
    installmentAmount?: number | string;
    status: string;
  }>;
  audits: Array<{
    id: string;
    role?: string;
    oldStatus?: string;
    newStatus: string;
    remarks?: string;
    createdAt: string;
    user?: {
      name: string;
      email: string;
      role: string;
    };
  }>;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatBDT(amount: number | string | undefined): string {
  const num = Number(amount) || 0;
  return `৳${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return String(dateStr);
  }
}

const statusBadgeStyles: Record<string, { color: string; bg: string; border: string }> = {
  DRAFT:       { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
  CALCULATED:  { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' },
  SUBMITTED:   { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.3)' },
  APPROVED:    { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
  PAID:        { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  CANCELLED:   { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
};

export default function PayrollReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;

  const [data, setData] = useState<PayrollAuditReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'fines' | 'attendance' | 'ledger' | 'activity' | 'audits'>('fines');

  // Pay Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({
    paymentMethod: 'Bank Transfer',
    transactionRef: '',
    paymentNote: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/payroll/${id}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to fetch payroll review information');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading payroll details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusUpdate = async (newStatus: string, extraData: any = {}) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...extraData
        })
      });

      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || `Failed to update status to ${newStatus}`);
      }

      showToast(`Payroll status successfully marked as ${newStatus}`);
      setShowPayModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleStatusUpdate('PAID', payForm);
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ minHeight: '60vh', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--primary, #3b82f6)', animation: 'spin 1s linear infinite' }}>
            progress_activity
          </span>
          <p style={{ marginTop: '12px', color: 'var(--text-muted, #64748b)', fontSize: '14px', fontWeight: 600 }}>
            Loading complete payroll review and telemetry audit...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
        <div className={styles.topNav}>
          <Link href="/erp/hr/payroll" className={styles.backBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Payroll
          </Link>
        </div>
        <div className={styles.contentCard} style={{ textAlign: 'center', padding: '60px 20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ef4444' }}>error</span>
          <h2 style={{ margin: '12px 0 6px', color: 'var(--text-main)' }}>Unable to load Payroll Review</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
            {error || 'Record could not be found or access is restricted.'}
          </p>
          <button onClick={loadData} className="btn btn-primary" style={{ padding: '8px 20px' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { payment, telemetry, fines, attendances, absentRecords, lateRecords, leaves, bonuses, deductions, taskRewards, overtimes, salaryAdvances, loans, audits } = data;
  const emp = payment.employee;
  const sc = statusBadgeStyles[payment.status] || statusBadgeStyles.DRAFT;
  const periodTitle = `${MONTH_NAMES[payment.month - 1] || 'Month ' + payment.month} ${payment.year}`;

  const totalDeductionsAmount = (payment.grossSalary || 0) - (payment.netSalary || 0);
  const totalEarningsAdditions = (payment.grossSalary || 0) - (payment.basicSalary || 0);

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: toastMessage.type === 'success' ? '#10b981' : '#ef4444',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '14px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {toastMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toastMessage.text}
        </div>
      )}

      {/* Top Navigation */}
      <div className={styles.topNav}>
        <Link href="/erp/hr/payroll" className={styles.backBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Payroll List
        </Link>

        <div className={styles.actionGroup}>
          <button
            onClick={() => window.print()}
            className={styles.backBtn}
            title="Print Audit Report"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
            Print Audit Slip
          </button>

          {['DRAFT', 'CALCULATED', 'SUBMITTED'].includes(payment.status) && (
            <button
              onClick={() => handleStatusUpdate('APPROVED')}
              disabled={actionLoading}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', color: '#3b82f6', borderColor: '#3b82f6', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
              Approve Payroll
            </button>
          )}

          {payment.status === 'APPROVED' && (
            <button
              onClick={() => setShowPayModal(true)}
              disabled={actionLoading}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>payments</span>
              Disburse / Pay
            </button>
          )}

          {payment.status === 'PAID' && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              fontWeight: 700,
              fontSize: '13px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>task_alt</span>
              Disbursed on {formatDate(payment.paymentDate)}
            </span>
          )}
        </div>
      </div>

      {/* Executive Hero Banner */}
      <div className={styles.heroCard}>
        <div className={styles.profileGroup}>
          <div className={styles.avatar}>
            {emp?.firstName?.[0] || 'E'}{emp?.lastName?.[0] || ''}
          </div>
          <div className={styles.profileInfo}>
            <h1>
              {emp?.firstName} {emp?.lastName}
              <span className={styles.empBadge}>{emp?.employeeId || 'EMP'}</span>
            </h1>
            <div className={styles.profileMeta}>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>work</span>
                {emp?.designationRef?.name || emp?.designation || 'Staff Member'}
              </span>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>corporate_fare</span>
                {emp?.departmentRef?.name || emp?.department || 'General'}
              </span>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
                Period: <strong>{periodTitle}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.heroMetrics}>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              color: sc.color,
              background: sc.bg,
              border: `1px solid ${sc.border}`,
              letterSpacing: '0.04em',
              display: 'inline-block',
              marginBottom: '10px'
            }}>
              {payment.status}
            </span>
            <div className={styles.netPayBox}>
              <div className={styles.netPayLabel}>Net Disbursable Salary</div>
              <div className={styles.netPayValue}>{formatBDT(payment.netSalary)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Base Fixed Salary</span>
            <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
          <div className={styles.statValue}>{formatBDT(payment.basicSalary)}</div>
          <div className={styles.statSubtext}>Standard Monthly Pay</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Additions & Rewards</span>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <span className="material-symbols-outlined">trending_up</span>
            </div>
          </div>
          <div className={styles.statValue} style={{ color: '#10b981' }}>+{formatBDT(totalEarningsAdditions)}</div>
          <div className={styles.statSubtext}>
            Bonus ({formatBDT(telemetry.totalBonusAmount)}) + Tasks ({formatBDT(telemetry.totalTaskRewardAmount)})
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Fines & Penalties</span>
            <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <span className="material-symbols-outlined">gavel</span>
            </div>
          </div>
          <div className={styles.statValue} style={{ color: '#ef4444' }}>-{formatBDT(telemetry.totalFineAmount)}</div>
          <div className={styles.statSubtext}>
            {fines.length} violation penalty records
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Absences & Deductions</span>
            <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <span className="material-symbols-outlined">event_busy</span>
            </div>
          </div>
          <div className={styles.statValue} style={{ color: '#f59e0b' }}>
            -{formatBDT(totalDeductionsAmount)}
          </div>
          <div className={styles.statSubtext}>
            {telemetry.absentDays} Absent Days • {telemetry.lateDays} Late arrivals
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button
          onClick={() => setActiveTab('fines')}
          className={`${styles.tabBtn} ${activeTab === 'fines' ? styles.active : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>gavel</span>
          Fines & Violations
          {fines.length > 0 && (
            <span className={`${styles.tabBadge} ${styles.danger}`}>{fines.length}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`${styles.tabBtn} ${activeTab === 'attendance' ? styles.active : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_month</span>
          Attendance & Absences
          <span className={styles.tabBadge}>{telemetry.absentDays} Abs / {telemetry.lateDays} Late</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`${styles.tabBtn} ${activeTab === 'ledger' ? styles.active : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span>
          Itemized Ledger Breakdown
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`${styles.tabBtn} ${activeTab === 'activity' ? styles.active : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>military_tech</span>
          Tasks, Overtime & Advances
        </button>

        <button
          onClick={() => setActiveTab('audits')}
          className={`${styles.tabBtn} ${activeTab === 'audits' ? styles.active : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
          Workflow & Approval Audit
          <span className={styles.tabBadge}>{audits.length}</span>
        </button>
      </div>

      {/* TAB CONTENT: FINES & PENALTIES (WHY THEY GOT FINED) */}
      {activeTab === 'fines' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>
                <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>warning</span>
                Fines & Disciplinary Penalties Audit
              </h3>
              <p className={styles.sectionDesc}>
                Detailed breakdown of administrative fines, violation reasons, and applied deduction penalties for {periodTitle}.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Fine Deductions: </span>
              <strong style={{ fontSize: '16px', color: '#ef4444' }}>{formatBDT(telemetry.totalFineAmount)}</strong>
            </div>
          </div>

          {fines.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={`material-symbols-outlined ${styles.emptyIcon}`} style={{ color: '#10b981' }}>verified_user</span>
              <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '16px' }}>Clean Record — No Fines Levied</h4>
              <p style={{ margin: 0, fontSize: '13px', maxWidth: '400px' }}>
                This employee has zero disciplinary fines, penalties, or compliance violations logged for this payroll month.
              </p>
            </div>
          ) : (
            <div className={styles.fineCardGrid}>
              {fines.map(fine => (
                <div key={fine.id} className={styles.fineCard}>
                  <div className={styles.fineCardHeader}>
                    <div>
                      <h4 className={styles.fineReasonTitle}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>flag</span>
                        Disciplinary Fine
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date: {formatDate(fine.date || fine.createdAt)}</span>
                    </div>
                    <span className={styles.fineAmount}>{formatBDT(fine.amount)}</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#991b1b', fontWeight: 700, marginBottom: '4px' }}>
                      Why they got fined:
                    </div>
                    <div className={styles.fineReasonNarrative}>
                      {fine.reason || 'No detailed reason specified by supervisor.'}
                    </div>
                  </div>

                  <div className={styles.fineFooter}>
                    <span>Status: <strong style={{ color: fine.status === 'DEDUCTED' ? '#10b981' : '#f59e0b' }}>{fine.status}</strong></span>
                    <span>Logged on: {formatDate(fine.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Also check if any attendance records had punishment penalties */}
          {attendances.some(a => a.punishmentAmount && Number(a.punishmentAmount) > 0) && (
            <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-main, #e2e8f0)', paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '18px' }}>history_toggle_off</span>
                Attendance-Level Violation Punishments
              </h4>
              <div className={styles.tableWrapper}>
                <table className={styles.auditTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Attendance Status</th>
                      <th>Why Punishment Was Levied (Reason)</th>
                      <th>Deduction Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.filter(a => a.punishmentAmount && Number(a.punishmentAmount) > 0).map(att => (
                      <tr key={att.id}>
                        <td style={{ fontWeight: 600 }}>{formatDate(att.date)}</td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            {att.status}
                          </span>
                        </td>
                        <td style={{ color: '#991b1b', fontWeight: 500 }}>
                          {att.punishmentReason || 'Violation recorded during attendance audit'}
                        </td>
                        <td style={{ color: '#dc2626', fontWeight: 700 }}>
                          {formatBDT(att.punishmentAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ATTENDANCE & ABSENCES */}
      {activeTab === 'attendance' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>
                <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>calendar_month</span>
                Attendance & Absence Telemetry
              </h3>
              <p className={styles.sectionDesc}>
                Comprehensive breakdown of present days, unexcused absences, late arrivals, and approved leaves for {periodTitle}.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '13px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600 }}>
                {telemetry.presentDays} Present
              </span>
              <span style={{ fontSize: '13px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 600 }}>
                {telemetry.absentDays} Absent
              </span>
              <span style={{ fontSize: '13px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 600 }}>
                {telemetry.lateDays} Late ({telemetry.totalLateMinutes} mins)
              </span>
            </div>
          </div>

          {/* Absences Table */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '18px' }}>event_busy</span>
              Unapproved Absence Log ({absentRecords.length})
            </h4>
            {absentRecords.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No unexcused absences logged for this period.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.auditTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Status</th>
                      <th>Reason / Absence Note</th>
                      <th>Action / Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentRecords.map(att => (
                      <tr key={att.id}>
                        <td style={{ fontWeight: 600 }}>{formatDate(att.date)}</td>
                        <td>{new Date(att.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            ABSENT
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {att.punishmentReason || 'Unapproved Absence / AWOL (Unpaid day deducted from salary)'}
                        </td>
                        <td style={{ color: '#ef4444', fontWeight: 600 }}>
                          1 Day Salary Deducted
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Late Arrivals Table */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '18px' }}>schedule</span>
              Late Check-ins & Penalty Minutes ({lateRecords.length})
            </h4>
            {lateRecords.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No late check-ins recorded.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.auditTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check-In Time</th>
                      <th>Check-Out Time</th>
                      <th>Late Minutes</th>
                      <th>Penalty Note / Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lateRecords.map(att => (
                      <tr key={att.id}>
                        <td style={{ fontWeight: 600 }}>{formatDate(att.date)}</td>
                        <td>{att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td>{att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td style={{ color: '#f59e0b', fontWeight: 700 }}>
                          {att.lateMinutes} mins late
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {att.lateMinutes && att.lateMinutes > 60
                            ? 'Exceeded 60m threshold (Full day deduction applied)'
                            : att.lateMinutes && att.lateMinutes >= 16
                            ? '16m - 60m threshold (Half day deduction applied)'
                            : 'Within grace period'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Approved Leaves Table */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '18px' }}>event_available</span>
              Approved Leave Requests ({leaves.length})
            </h4>
            {leaves.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No formal leave requests recorded for this period.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.auditTable}>
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Duration</th>
                      <th>Reason for Leave</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map(l => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 600 }}>{l.type}</td>
                        <td>{formatDate(l.startDate)} → {formatDate(l.endDate)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{l.reason || 'Personal Leave'}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: l.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: l.status === 'APPROVED' ? '#10b981' : '#f59e0b'
                          }}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ITEMIZED LEDGER BREAKDOWN */}
      {activeTab === 'ledger' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>
                <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>receipt_long</span>
                Itemized Compensation & Deductions Ledger
              </h3>
              <p className={styles.sectionDesc}>
                Detailed mathematical breakdown of Gross Earnings minus all Deductions resulting in Net Pay.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Calculated Net Pay: </span>
              <strong style={{ fontSize: '18px', color: '#10b981' }}>{formatBDT(payment.netSalary)}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {/* Left: Earnings */}
            <div style={{ border: '1px solid var(--border-main, #e2e8f0)', borderRadius: '14px', padding: '18px', background: 'var(--surface-card)' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined">add_circle</span>
                Gross Earnings ({formatBDT(payment.grossSalary)})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderBottom: '1px dashed var(--border-main)' }}>
                  <span>Base Fixed Salary</span>
                  <strong>{formatBDT(payment.basicSalary)}</strong>
                </div>

                {bonuses.map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderBottom: '1px dashed var(--border-main)' }}>
                    <span>Bonus: {b.title || b.type} {b.reason ? `(${b.reason})` : ''}</span>
                    <strong style={{ color: '#10b981' }}>+{formatBDT(b.amount)}</strong>
                  </div>
                ))}

                {taskRewards.map(tr => (
                  <div key={tr.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderBottom: '1px dashed var(--border-main)' }}>
                    <span>Task Reward: {tr.taskReward?.title || tr.reviewNotes || 'Objective Achieved'}</span>
                    <strong style={{ color: '#10b981' }}>+{formatBDT(tr.rewardAmount || tr.pointsAwarded)}</strong>
                  </div>
                ))}

                {overtimes.map(ot => (
                  <div key={ot.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderBottom: '1px dashed var(--border-main)' }}>
                    <span>Overtime ({ot.hours} hrs @ {ot.rate}x)</span>
                    <strong style={{ color: '#10b981' }}>Calculated in Gross</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Deductions */}
            <div style={{ border: '1px solid var(--border-main, #e2e8f0)', borderRadius: '14px', padding: '18px', background: 'var(--surface-card)' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined">remove_circle</span>
                Total Deductions ({formatBDT(totalDeductionsAmount)})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {deductions.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>
                    No system deductions recorded for this cycle.
                  </div>
                ) : (
                  deductions.map(d => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderBottom: '1px dashed var(--border-main)' }}>
                      <div>
                        <strong style={{ color: '#dc2626' }}>[{d.type}]</strong> {d.reason}
                      </div>
                      <strong style={{ color: '#ef4444', whiteSpace: 'nowrap' }}>-{formatBDT(d.amount)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Formula summary */}
          <div style={{
            marginTop: '20px',
            background: 'var(--surface-hover, #f8fafc)',
            border: '1px solid var(--border-main, #e2e8f0)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Ledger Equation: <strong>Base ({formatBDT(payment.basicSalary)})</strong> + <strong>Additions ({formatBDT(totalEarningsAdditions)})</strong> - <strong>Deductions ({formatBDT(totalDeductionsAmount)})</strong>
            </span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>
              = Net Pay: {formatBDT(payment.netSalary)}
            </span>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TASKS, OVERTIME & ADVANCES */}
      {activeTab === 'activity' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>
                <span className="material-symbols-outlined" style={{ color: '#8b5cf6' }}>military_tech</span>
                Tasks, Overtime, Advances & Loan Activity
              </h3>
              <p className={styles.sectionDesc}>
                Employee milestone rewards, advance recoveries, and active credit schedules.
              </p>
            </div>
          </div>

          {/* Task Rewards */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '18px' }}>emoji_events</span>
              Approved Task Reward Submissions ({taskRewards.length})
            </h4>
            {taskRewards.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No task milestone rewards submitted this month.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.auditTable}>
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Reward Amount</th>
                      <th>Evaluation Notes</th>
                      <th>Approved Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskRewards.map(tr => (
                      <tr key={tr.id}>
                        <td style={{ fontWeight: 600 }}>{tr.taskReward?.title || 'Objective Completed'}</td>
                        <td style={{ color: '#10b981', fontWeight: 700 }}>{formatBDT(tr.rewardAmount || tr.pointsAwarded)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{tr.reviewNotes || tr.taskReward?.description || 'Met performance criteria'}</td>
                        <td>{formatDate(tr.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Advances & Loans */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '18px' }}>credit_card</span>
              Salary Advances & Active Loans
            </h4>
            {salaryAdvances.length === 0 && loans.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No outstanding salary advances or loans on file.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.auditTable}>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Total Principal</th>
                      <th>Reason / Note</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryAdvances.map(adv => (
                      <tr key={adv.id}>
                        <td style={{ fontWeight: 600 }}>Salary Advance</td>
                        <td style={{ fontWeight: 700 }}>{formatBDT(adv.amount)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{adv.reason || 'Emergency advance'}</td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                            {adv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {loans.map(loan => (
                      <tr key={loan.id}>
                        <td style={{ fontWeight: 600 }}>Employee Loan</td>
                        <td style={{ fontWeight: 700 }}>{formatBDT(loan.principalAmount)} (Bal: {formatBDT(loan.outstandingBalance)})</td>
                        <td style={{ color: 'var(--text-muted)' }}>Monthly EMI: {formatBDT(loan.installmentAmount)}</td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: APPROVAL AUDIT TRAIL */}
      {activeTab === 'audits' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>
                <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>history</span>
                Workflow & Approval Audit Trail
              </h3>
              <p className={styles.sectionDesc}>
                Immutable governance log tracking every transition, reviewer action, and payment execution.
              </p>
            </div>
          </div>

          {audits.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={`material-symbols-outlined ${styles.emptyIcon}`}>shield</span>
              <p style={{ margin: 0, fontSize: '13px' }}>No audit trail entries recorded yet.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.auditTable}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action / Status Change</th>
                    <th>Performed By</th>
                    <th>Role</th>
                    <th>Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map(aud => (
                    <tr key={aud.id}>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {new Date(aud.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6'
                        }}>
                          {aud.oldStatus ? `${aud.oldStatus} → ${aud.newStatus}` : aud.newStatus}
                        </span>
                      </td>
                      <td>
                        <strong>{aud.user?.name || 'System / Admin'}</strong>
                        {aud.user?.email && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{aud.user.email}</div>}
                      </td>
                      <td style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                        {aud.role || aud.user?.role || 'User'}
                      </td>
                      <td style={{ color: 'var(--text-main)' }}>
                        {aud.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DISBURSE / PAY MODAL */}
      {showPayModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={e => { if (e.target === e.currentTarget) setShowPayModal(false); }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '28px', background: 'var(--surface-card, #ffffff)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Disburse Salary Payment</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Record disbursement for {emp?.firstName} {emp?.lastName}
                </p>
              </div>
              <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Amount to Disburse</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                  {formatBDT(payment.netSalary)}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Payment Method *</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: 'var(--text-main)', fontSize: '13px' }}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="bKash">bKash (Mobile Financial Services)</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Cheque">Corporate Cheque</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Transaction / Cheque Reference</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-9988231 or Cheque #1024"
                  value={payForm.transactionRef}
                  onChange={e => setPayForm(f => ({ ...f, transactionRef: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: 'var(--text-main)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Disbursement Note / Remarks</label>
                <textarea
                  placeholder="Optional internal remarks..."
                  value={payForm.paymentNote}
                  onChange={e => setPayForm(f => ({ ...f, paymentNote: e.target.value }))}
                  rows={2}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: 'var(--text-main)', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 700 }}
                >
                  {actionLoading ? 'Processing...' : 'Confirm & Disburse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
