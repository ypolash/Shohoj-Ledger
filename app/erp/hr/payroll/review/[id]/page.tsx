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
  increments?: Array<{
    id: string;
    eventType: string;
    effectiveDate: string;
    description?: string;
    previousData?: any;
    newData?: any;
    createdAt?: string;
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

  // Fine Edit & Add State
  const [editingFineId, setEditingFineId] = useState<string | null>(null);
  const [editFineAmount, setEditFineAmount] = useState<string | number>('');
  const [editFineReason, setEditFineReason] = useState<string>('');
  const [editFineStatus, setEditFineStatus] = useState<string>('PENDING');
  const [fineActionLoading, setFineActionLoading] = useState(false);

  // Fine Reduction State
  const [reducingFineId, setReducingFineId] = useState<string | null>(null);
  const [reduceDiscountAmount, setReduceDiscountAmount] = useState<number | string>('');
  const [reduceNewAmount, setReduceNewAmount] = useState<number | string>('');
  const [reduceReason, setReduceReason] = useState<string>('Management pardon / waiver');
  const [reducePreset, setReducePreset] = useState<number | null>(50);

  // Attendance Penalty Reduction State
  const [reducingAttendanceId, setReducingAttendanceId] = useState<string | null>(null);
  const [reduceAttendanceNewAmount, setReduceAttendanceNewAmount] = useState<number | string>('');
  const [reduceAttendanceReason, setReduceAttendanceReason] = useState<string>('Management penalty reduction');

  const [showAddFineForm, setShowAddFineForm] = useState(false);
  const [newFineAmount, setNewFineAmount] = useState<string | number>('');
  const [newFineReason, setNewFineReason] = useState<string>('');
  const [newFineDate, setNewFineDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleKpiCardClick = (tab: 'ledger' | 'activity' | 'fines' | 'attendance') => {
    setActiveTab(tab);
    const navElem = document.getElementById('reviewTabsNav');
    if (navElem) {
      navElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  const handleStartEditFine = (fine: any) => {
    setReducingFineId(null);
    setEditingFineId(fine.id);
    setEditFineAmount(fine.amount);
    setEditFineReason(fine.reason || '');
    setEditFineStatus(fine.status || 'PENDING');
  };

  const handleSaveEditFine = async (fineId: string) => {
    if (!editFineAmount || Number(editFineAmount) < 0) {
      showToast('Please specify a valid fine amount', 'error');
      return;
    }
    if (!String(editFineReason).trim()) {
      showToast('Please specify a violation reason for the fine', 'error');
      return;
    }
    setFineActionLoading(true);
    try {
      const res = await fetch(`/api/hr/fines/${fineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(editFineAmount),
          reason: editFineReason,
          status: editFineStatus,
          payrollId: id
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to update fine');
      showToast('Fine updated successfully');
      setEditingFineId(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Error updating fine', 'error');
    } finally {
      setFineActionLoading(false);
    }
  };

  const handleDeleteFine = async (fineId: string) => {
    if (!confirm('Are you sure you want to remove/waive this disciplinary fine?')) return;
    setFineActionLoading(true);
    try {
      const res = await fetch(`/api/hr/fines/${fineId}?payrollId=${id}`, {
        method: 'DELETE'
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to delete fine');
      showToast('Disciplinary fine removed successfully');
      setEditingFineId(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Error deleting fine', 'error');
    } finally {
      setFineActionLoading(false);
    }
  };

  // Fine Reduction Handlers
  const handleStartReduceFine = (fine: any) => {
    setEditingFineId(null);
    setReducingFineId(fine.id);
    const orig = Number(fine.amount) || 0;
    const discount50 = Math.round(orig * 0.5);
    setReducePreset(50);
    setReduceDiscountAmount(discount50);
    setReduceNewAmount(orig - discount50);
    setReduceReason('50% fine reduction granted by Management');
  };

  const handleSelectReducePreset = (fine: any, percent: number) => {
    setReducePreset(percent);
    const orig = Number(fine.amount) || 0;
    const discount = Math.round((orig * percent) / 100);
    const target = Math.max(0, orig - discount);
    setReduceDiscountAmount(discount);
    setReduceNewAmount(target);
    if (percent === 100) {
      setReduceReason('Waived 100% in full by Management');
    } else {
      setReduceReason(`${percent}% fine reduction granted by Management`);
    }
  };

  const handleDiscountAmountChange = (fine: any, discountVal: string) => {
    setReducePreset(null);
    setReduceDiscountAmount(discountVal);
    const orig = Number(fine.amount) || 0;
    const numDisc = Number(discountVal) || 0;
    setReduceNewAmount(Math.max(0, orig - numDisc));
  };

  const handleNewAmountChange = (fine: any, newVal: string) => {
    setReducePreset(null);
    setReduceNewAmount(newVal);
    const orig = Number(fine.amount) || 0;
    const numNew = Number(newVal) || 0;
    setReduceDiscountAmount(Math.max(0, orig - numNew));
  };

  const handleConfirmReduceFine = async (fine: any) => {
    const origAmount = Number(fine.amount) || 0;
    const targetAmount = Math.max(0, Number(reduceNewAmount) || 0);
    if (targetAmount >= origAmount) {
      showToast('New fine amount must be less than current fine to reduce it', 'error');
      return;
    }

    setFineActionLoading(true);
    try {
      const discount = origAmount - targetAmount;
      const note = reduceReason.trim() || 'Management reduction';
      const updatedReason = `${fine.reason || 'Disciplinary fine'} [Reduced from ৳${origAmount} to ৳${targetAmount}: ${note}]`;
      const newStatus = targetAmount === 0 ? 'CANCELLED' : fine.status;

      const res = await fetch(`/api/hr/fines/${fine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: targetAmount,
          reason: updatedReason,
          status: newStatus,
          payrollId: id
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to reduce fine');

      showToast(`Fine reduced by ৳${discount.toLocaleString()}! Employee take-home pay increased.`);
      setReducingFineId(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Error reducing fine', 'error');
    } finally {
      setFineActionLoading(false);
    }
  };

  const handleQuickWaiveFine = async (fine: any) => {
    const amt = Number(fine.amount) || 0;
    if (!confirm(`Waive 100% of this fine (৳${amt.toLocaleString()})? This immediately restores the amount to the employee's take-home pay.`)) {
      return;
    }

    setFineActionLoading(true);
    try {
      const res = await fetch(`/api/hr/fines/${fine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 0,
          status: 'CANCELLED',
          reason: `${fine.reason || 'Disciplinary fine'} [Waived 100% by Management]`,
          payrollId: id
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to waive fine');

      showToast(`Fine waived in full! ৳${amt.toLocaleString()} restored to net salary.`);
      setReducingFineId(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Error waiving fine', 'error');
    } finally {
      setFineActionLoading(false);
    }
  };

  // Attendance Punishment Handlers
  const handleStartReduceAttendance = (att: any) => {
    setReducingAttendanceId(att.id);
    const curr = Number(att.punishmentAmount) || 0;
    setReduceAttendanceNewAmount(Math.round(curr / 2));
    setReduceAttendanceReason('50% penalty reduction by Management');
  };

  const handleConfirmReduceAttendance = async (att: any) => {
    const orig = Number(att.punishmentAmount) || 0;
    const target = Math.max(0, Number(reduceAttendanceNewAmount) || 0);

    setFineActionLoading(true);
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REDUCE_ATTENDANCE_PUNISHMENT',
          attendanceId: att.id,
          newPunishmentAmount: target,
          reason: reduceAttendanceReason.trim() || 'Reduced by Management'
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to reduce penalty');

      showToast(`Attendance penalty reduced from ৳${orig} to ৳${target}!`);
      setReducingAttendanceId(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Error reducing penalty', 'error');
    } finally {
      setFineActionLoading(false);
    }
  };

  const handleQuickWaiveAttendance = async (att: any) => {
    const amt = Number(att.punishmentAmount) || 0;
    if (!confirm(`Waive 100% of this attendance penalty (৳${amt.toLocaleString()})?`)) return;

    setFineActionLoading(true);
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REDUCE_ATTENDANCE_PUNISHMENT',
          attendanceId: att.id,
          newPunishmentAmount: 0,
          reason: 'Waived 100% by Management'
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to waive penalty');

      showToast(`Attendance penalty of ৳${amt.toLocaleString()} waived!`);
      setReducingAttendanceId(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Error waiving penalty', 'error');
    } finally {
      setFineActionLoading(false);
    }
  };

  const handleWaiveAllFines = async () => {
    const total = telemetry?.totalFineAmount || 0;
    if (!confirm(`Are you sure you want to waive all active fines (totaling ৳${Number(total).toLocaleString()}) for this employee? Full amount will be restored to take-home pay.`)) {
      return;
    }

    setFineActionLoading(true);
    try {
      if (data?.fines) {
        for (const fine of data.fines) {
          if (fine.status !== 'CANCELLED' && Number(fine.amount) > 0) {
            await fetch(`/api/hr/fines/${fine.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: 0,
                status: 'CANCELLED',
                reason: `${fine.reason || 'Fine'} [All fines waived by Management]`,
                payrollId: id
              })
            });
          }
        }
      }

      if (data?.attendances) {
        for (const att of data.attendances) {
          if (Number(att.punishmentAmount || 0) > 0) {
            await fetch(`/api/payroll/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'REDUCE_ATTENDANCE_PUNISHMENT',
                attendanceId: att.id,
                newPunishmentAmount: 0,
                reason: 'All attendance penalties waived by Management'
              })
            });
          }
        }
      }

      showToast('All fines and penalties waived! Full salary restored.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Error waiving all fines', 'error');
    } finally {
      setFineActionLoading(false);
    }
  };

  const handleCreateFine = async (e: React.FormEvent, employeeId?: string) => {
    e.preventDefault();
    if (!newFineAmount || Number(newFineAmount) <= 0) {
      showToast('Please specify a valid fine amount', 'error');
      return;
    }
    if (!newFineReason.trim()) {
      showToast('Please specify a violation reason for the fine', 'error');
      return;
    }
    if (!employeeId) {
      showToast('Employee information is not loaded', 'error');
      return;
    }
    setFineActionLoading(true);
    try {
      const res = await fetch('/api/hr/fines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          amount: Number(newFineAmount),
          reason: newFineReason.trim(),
          date: newFineDate || new Date().toISOString()
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to record fine');
      showToast('Disciplinary fine recorded successfully');
      setShowAddFineForm(false);
      setNewFineAmount('');
      setNewFineReason('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Error recording fine', 'error');
    } finally {
      setFineActionLoading(false);
    }
  };

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

  const { payment, telemetry, fines, attendances, absentRecords, lateRecords, leaves, bonuses, deductions, taskRewards, overtimes, salaryAdvances, loans, increments = [], audits } = data;
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
          {emp?.id && (
            <Link
              href={`/erp/hr/employees/${emp.id}`}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', color: 'var(--text-main)', borderColor: 'var(--border-main)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="View full Employee Profile & HR Dossier"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>badge</span>
              <span>HR Profile</span>
            </Link>
          )}

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
        <div
          className={`${styles.statCard} ${styles.statCardClickable} ${activeTab === 'ledger' ? styles.statCardActiveLedger : ''}`}
          onClick={() => handleKpiCardClick('ledger')}
          role="button"
          tabIndex={0}
          title="Click to view Itemized Ledger Breakdown"
        >
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Base Fixed Salary</span>
            <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
          <div className={styles.statValue}>{formatBDT(payment.basicSalary)}</div>
          <div className={styles.statSubtext}>
            <span>Standard Monthly Pay</span>
            {emp?.id && (
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '11px' }}>
                Base Rate
              </span>
            )}
          </div>
        </div>

        <div
          className={`${styles.statCard} ${styles.statCardClickable} ${activeTab === 'activity' ? styles.statCardActiveActivity : ''}`}
          onClick={() => handleKpiCardClick('activity')}
          role="button"
          tabIndex={0}
          title="Click to view Tasks, Overtime & Rewards"
        >
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Additions & Rewards</span>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <span className="material-symbols-outlined">trending_up</span>
            </div>
          </div>
          <div className={styles.statValue} style={{ color: '#10b981' }}>+{formatBDT(totalEarningsAdditions)}</div>
          <div className={styles.statSubtext}>
            <span>Bonus ({formatBDT(telemetry.totalBonusAmount)}) + Tasks ({formatBDT(telemetry.totalTaskRewardAmount)})</span>
            <span style={{ marginLeft: 'auto', color: '#10b981', fontSize: '11px', fontWeight: 600 }}>Tasks →</span>
          </div>
        </div>

        <div
          className={`${styles.statCard} ${styles.statCardClickable} ${activeTab === 'fines' ? styles.statCardActiveFines : ''}`}
          onClick={() => handleKpiCardClick('fines')}
          role="button"
          tabIndex={0}
          title="Click to audit & edit disciplinary fines"
        >
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Fines & Penalties</span>
            <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <span className="material-symbols-outlined">gavel</span>
            </div>
          </div>
          <div className={styles.statValue} style={{ color: '#ef4444' }}>-{formatBDT(telemetry.totalFineAmount)}</div>
          <div className={styles.statSubtext}>
            <span>{fines.length} violation penalty records</span>
            <span style={{ marginLeft: 'auto', color: '#ef4444', fontSize: '11px', fontWeight: 600 }}>Edit Fines →</span>
          </div>
        </div>

        <div
          className={`${styles.statCard} ${styles.statCardClickable} ${activeTab === 'attendance' ? styles.statCardActiveAttendance : ''}`}
          onClick={() => handleKpiCardClick('attendance')}
          role="button"
          tabIndex={0}
          title="Click to view Attendance & Absences telemetry"
        >
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
            <span>{telemetry.absentDays} Absent Days • {telemetry.lateDays} Late</span>
            <span style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: '11px', fontWeight: 600 }}>Attendance →</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div id="reviewTabsNav" className={styles.tabNav}>
        <button
          onClick={() => setActiveTab('fines')}
          className={`${styles.tabBtn} ${activeTab === 'fines' ? styles.active : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>gavel</span>
          Fines
          {fines.length > 0 && (
            <span className={`${styles.tabBadge} ${styles.danger}`}>{fines.length}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`${styles.tabBtn} ${activeTab === 'attendance' ? styles.active : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_month</span>
          Attendance
          <span className={styles.tabBadge}>{telemetry.absentDays} Abs / {telemetry.lateDays} Late</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`${styles.tabBtn} ${activeTab === 'ledger' ? styles.active : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span>
          Ledger
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`${styles.tabBtn} ${activeTab === 'activity' ? styles.active : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>military_tech</span>
          Tasks & Overtime
        </button>

        <button
          onClick={() => setActiveTab('audits')}
          className={`${styles.tabBtn} ${activeTab === 'audits' ? styles.active : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
          Audit Log
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
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Fine Deductions: </span>
                <strong style={{ fontSize: '16px', color: '#ef4444' }}>{formatBDT(telemetry.totalFineAmount)}</strong>
              </div>
              {telemetry.totalFineAmount > 0 && (
                <button
                  type="button"
                  disabled={fineActionLoading}
                  onClick={handleWaiveAllFines}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)', fontWeight: 600 }}
                  title="Waive all fines and restore employee take-home pay"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>price_check</span>
                  <span>Waive All Fines</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAddFineForm(prev => !prev)}
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', fontWeight: 600 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{showAddFineForm ? 'close' : 'add'}</span>
                <span>{showAddFineForm ? 'Close Form' : 'Levy Fine'}</span>
              </button>
            </div>
          </div>

          {/* Inline Add Fine Form */}
          {showAddFineForm && (
            <form onSubmit={e => handleCreateFine(e, emp?.id)} style={{ background: 'var(--surface-hover, #f8fafc)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '14px', padding: '18px', marginBottom: '22px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>gavel</span>
                Record / Levy Disciplinary Fine
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Fine Amount (BDT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={newFineAmount}
                    onChange={e => setNewFineAmount(e.target.value)}
                    placeholder="e.g. 500"
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Violation Date *</label>
                  <input
                    type="date"
                    value={newFineDate}
                    onChange={e => setNewFineDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: 'var(--text-main)', fontSize: '13px' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Reason for Fine (Violation Description) *</label>
                <input
                  type="text"
                  value={newFineReason}
                  onChange={e => setNewFineReason(e.target.value)}
                  placeholder="e.g., Unexcused absence, Late report submission, Uniform violation"
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: 'var(--text-main)', fontSize: '13px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={fineActionLoading}
                  className="btn btn-primary"
                  style={{ padding: '7px 18px', fontSize: '13px', background: '#ef4444', borderColor: '#ef4444', fontWeight: 600 }}
                >
                  {fineActionLoading ? 'Saving...' : 'Apply Fine Deduction'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddFineForm(false)}
                  className="btn btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '13px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {fines.length === 0 && !showAddFineForm ? (
            <div className={styles.emptyState}>
              <span className={`material-symbols-outlined ${styles.emptyIcon}`} style={{ color: '#10b981' }}>verified_user</span>
              <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '16px' }}>Clean Record — No Fines Levied</h4>
              <p style={{ margin: 0, fontSize: '13px', maxWidth: '400px' }}>
                This employee has zero disciplinary fines, penalties, or compliance violations logged for this payroll month.
              </p>
              <button
                type="button"
                onClick={() => setShowAddFineForm(true)}
                className="btn btn-secondary"
                style={{ marginTop: '12px', padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontWeight: 600 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                <span>Levy Disciplinary Fine</span>
              </button>
            </div>
          ) : (
            <div className={styles.fineCardGrid}>
              {fines.map(fine => {
                const isEditing = editingFineId === fine.id;
                const isReducing = reducingFineId === fine.id;
                const fineNum = Number(fine.amount) || 0;

                return (
                  <div key={fine.id} className={styles.fineCard}>
                    {isReducing ? (
                      /* Dedicated Fine Reduction Form */
                      <div className={styles.fineReduceBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(245, 158, 11, 0.3)', paddingBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>trending_down</span>
                            Reduce Disciplinary Fine
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current: {formatBDT(fine.amount)}</span>
                        </div>

                        {/* Quick Reduction Presets */}
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                            Quick Reduction Presets:
                          </label>
                          <div className={styles.reducePresetRow}>
                            <button
                              type="button"
                              onClick={() => handleSelectReducePreset(fine, 25)}
                              className={`${styles.reducePresetBtn} ${reducePreset === 25 ? styles.active : ''}`}
                            >
                              -25% Off
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectReducePreset(fine, 50)}
                              className={`${styles.reducePresetBtn} ${reducePreset === 50 ? styles.active : ''}`}
                            >
                              -50% Off
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectReducePreset(fine, 75)}
                              className={`${styles.reducePresetBtn} ${reducePreset === 75 ? styles.active : ''}`}
                            >
                              -75% Off
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectReducePreset(fine, 100)}
                              className={`${styles.reducePresetBtn} ${reducePreset === 100 ? styles.active : ''}`}
                              style={{ color: '#dc2626' }}
                            >
                              Waive 100% (৳0)
                            </button>
                          </div>
                        </div>

                        {/* Custom inputs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                              Reduce By Discount (BDT)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={fineNum}
                              value={reduceDiscountAmount}
                              onChange={e => handleDiscountAmountChange(fine, e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 700 }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                              New Reduced Fine (BDT)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={fineNum}
                              value={reduceNewAmount}
                              onChange={e => handleNewAmountChange(fine, e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: '#dc2626', fontSize: '12px', fontWeight: 700 }}
                            />
                          </div>
                        </div>

                        {/* Live Comparison Badge */}
                        <div className={styles.reduceComparison}>
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Current: </span>
                            <strong style={{ textDecoration: 'line-through', color: '#94a3b8' }}>{formatBDT(fineNum)}</strong>
                            <span style={{ margin: '0 6px', color: '#10b981' }}>➔</span>
                            <span style={{ color: '#10b981', fontWeight: 700 }}>
                              New: {formatBDT(reduceNewAmount)}
                            </span>
                          </div>
                          <div style={{ color: '#10b981', fontWeight: 700, fontSize: '11px' }}>
                            +{formatBDT(Number(fineNum) - Number(reduceNewAmount || 0))} Net Pay
                          </div>
                        </div>

                        {/* Reduction Reason Note */}
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                            Reduction Note / Reason
                          </label>
                          <input
                            type="text"
                            value={reduceReason}
                            onChange={e => setReduceReason(e.target.value)}
                            placeholder="e.g. Good conduct pardon, first offense grace"
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: 'var(--text-main)', fontSize: '12px' }}
                          />
                        </div>

                        {/* Reduction Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <button
                            type="button"
                            disabled={fineActionLoading}
                            onClick={() => handleConfirmReduceFine(fine)}
                            className="btn btn-primary"
                            style={{ padding: '6px 14px', fontSize: '12px', background: '#10b981', borderColor: '#10b981', fontWeight: 700 }}
                          >
                            {fineActionLoading ? 'Saving...' : 'Apply Fine Reduction'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setReducingFineId(null)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : isEditing ? (
                      /* Inline Full Edit Form for this fine */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                            Edit Disciplinary Fine
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {fine.id.slice(0, 8)}</span>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                            Fine Amount (BDT)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editFineAmount}
                            onChange={e => setEditFineAmount(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 700 }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                            Reason / Description
                          </label>
                          <textarea
                            rows={2}
                            value={editFineReason}
                            onChange={e => setEditFineReason(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: 'var(--text-main)', fontSize: '12px', resize: 'vertical' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                            Status
                          </label>
                          <select
                            value={editFineStatus}
                            onChange={e => setEditFineStatus(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600 }}
                          >
                            <option value="PENDING">PENDING (Will Deduct on Pay)</option>
                            <option value="DEDUCTED">DEDUCTED (Applied to Payroll)</option>
                            <option value="CANCELLED">CANCELLED (Waived / Void)</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          <button
                            type="button"
                            disabled={fineActionLoading}
                            onClick={() => handleSaveEditFine(fine.id)}
                            className="btn btn-primary"
                            style={{ padding: '6px 14px', fontSize: '12px', background: '#dc2626', borderColor: '#dc2626', fontWeight: 600 }}
                          >
                            {fineActionLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFineId(null)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={fineActionLoading}
                            onClick={() => handleDeleteFine(fine.id)}
                            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px' }}
                            title="Delete or waive this fine"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode for this fine */
                      <>
                        <div className={styles.fineCardHeader}>
                          <div>
                            <h4 className={styles.fineReasonTitle}>
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>flag</span>
                              Disciplinary Fine
                            </h4>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date: {formatDate(fine.date || fine.createdAt)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={styles.fineAmount}>{formatBDT(fine.amount)}</span>
                          </div>
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
                          <span>Status: <strong style={{ color: fine.status === 'DEDUCTED' ? '#10b981' : fine.status === 'CANCELLED' ? '#ef4444' : '#f59e0b' }}>{fine.status}</strong></span>
                          
                          {/* Quick Actions Row */}
                          <div className={styles.fineCardActions}>
                            {fineNum > 0 && fine.status !== 'CANCELLED' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartReduceFine(fine)}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#b45309', borderColor: 'rgba(245, 158, 11, 0.4)', fontWeight: 700 }}
                                  title="Reduce this fine amount"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_down</span>
                                  <span>Reduce Fine</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleQuickWaiveFine(fine)}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)', fontWeight: 600 }}
                                  title="Waive 100% of this fine"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>price_check</span>
                                  <span>Waive</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => handleStartEditFine(fine)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--primary, #3b82f6)', fontWeight: 600 }}
                              title="Edit fine amount or reason"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Also check if any attendance records had punishment penalties */}
          {attendances.some(a => a.punishmentAmount && Number(a.punishmentAmount) > 0) && (
            <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-main, #e2e8f0)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '18px' }}>history_toggle_off</span>
                  Attendance-Level Violation Punishments
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Penalties logged during attendance check-in audits
                </span>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.auditTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Attendance Status</th>
                      <th>Why Punishment Was Levied (Reason)</th>
                      <th>Deduction Amount</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.filter(a => a.punishmentAmount && Number(a.punishmentAmount) > 0).map(att => {
                      const isReducingAtt = reducingAttendanceId === att.id;
                      const attPenalty = Number(att.punishmentAmount) || 0;

                      return (
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
                          <td style={{ textAlign: 'right' }}>
                            {isReducingAtt ? (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px', textAlign: 'left', background: 'var(--surface-hover)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="number"
                                    min="0"
                                    max={attPenalty}
                                    value={reduceAttendanceNewAmount}
                                    onChange={e => setReduceAttendanceNewAmount(e.target.value)}
                                    placeholder="New amount"
                                    style={{ width: '90px', padding: '4px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: '#dc2626', fontWeight: 700 }}
                                  />
                                  <input
                                    type="text"
                                    value={reduceAttendanceReason}
                                    onChange={e => setReduceAttendanceReason(e.target.value)}
                                    placeholder="Reason"
                                    style={{ width: '130px', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--border-main)', background: 'var(--surface-card)', color: 'var(--text-main)' }}
                                  />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    disabled={fineActionLoading}
                                    onClick={() => handleConfirmReduceAttendance(att)}
                                    className="btn btn-primary"
                                    style={{ padding: '3px 8px', fontSize: '11px', background: '#10b981', borderColor: '#10b981', fontWeight: 700 }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setReducingAttendanceId(null)}
                                    className="btn btn-secondary"
                                    style={{ padding: '3px 6px', fontSize: '11px' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleStartReduceAttendance(att)}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#b45309', borderColor: 'rgba(245, 158, 11, 0.4)', fontWeight: 600 }}
                                  title="Reduce penalty amount"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>trending_down</span>
                                  <span>Reduce</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickWaiveAttendance(att)}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)', fontWeight: 600 }}
                                  title="Waive penalty"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>price_check</span>
                                  <span>Waive</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '8px 0', borderBottom: '1px dashed var(--border-main)' }}>
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

          {/* Salary Increment Progression History Section */}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-main)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '18px' }}>trending_up</span>
                  Salary Increment & Compensation Progression History ({increments.length})
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Permanent base salary increases, merit appraisals, and promotion progression logs.
                </p>
              </div>

              {emp?.id && (
                <Link
                  href={`/erp/hr/employees/${emp.id}`}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px', color: 'var(--text-main)', borderColor: 'var(--border-main)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>badge</span>
                  <span>Manage in HR Profile →</span>
                </Link>
              )}
            </div>

            {increments.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px dashed var(--border-main)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--text-muted)', marginBottom: '6px' }}>insights</span>
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  No historical salary increments recorded yet for {emp?.firstName} {emp?.lastName}.
                </p>
                {emp?.id && (
                  <Link
                    href={`/erp/hr/employees/${emp.id}`}
                    className="btn btn-secondary"
                    style={{ padding: '5px 14px', fontSize: '12px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
                    <span>Grant in Employee HR Dossier</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.auditTable}>
                  <thead>
                    <tr>
                      <th>Effective Date</th>
                      <th>Previous Base Pay</th>
                      <th>Increment Granted</th>
                      <th>New Base Pay</th>
                      <th>Reason / Appraisal Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {increments.map(inc => {
                      const prevSalary = inc.previousData?.basicSalary !== undefined ? Number(inc.previousData.basicSalary) : null;
                      const newSalary = inc.newData?.basicSalary !== undefined ? Number(inc.newData.basicSalary) : null;
                      const incAmount = inc.newData?.incrementAmount !== undefined ? Number(inc.newData.incrementAmount) : (prevSalary !== null && newSalary !== null ? newSalary - prevSalary : null);
                      const incPercent = inc.newData?.incrementPercentage !== undefined ? inc.newData.incrementPercentage : (prevSalary && incAmount ? ((incAmount / prevSalary) * 100).toFixed(1) : null);

                      return (
                        <tr key={inc.id}>
                          <td style={{ fontWeight: 600 }}>{formatDate(inc.effectiveDate)}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{prevSalary !== null ? formatBDT(prevSalary) : '—'}</td>
                          <td>
                            <span style={{ color: '#10b981', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              +{incAmount !== null ? formatBDT(incAmount) : '—'} {incPercent ? `(+${incPercent}%)` : ''}
                            </span>
                          </td>
                          <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>{newSalary !== null ? formatBDT(newSalary) : '—'}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{inc.description || inc.newData?.reason || 'Performance appraisal increment'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
