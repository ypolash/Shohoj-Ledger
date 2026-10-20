"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PayrollRecord {
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
    designation?: string;
    employeeId: string;
    email?: string;
    department?: string;
    departmentRef?: { name: string };
    designationRef?: { name: string };
  };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  designation?: string;
  basicSalary?: number | string;
  department?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const statusColors: Record<string, { color: string; bg: string; border: string }> = {
  DRAFT:       { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
  CALCULATED:  { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' },
  SUBMITTED:   { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.3)' },
  APPROVED:    { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
  PAID:        { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  CANCELLED:   { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
};

export default function PayrollPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [yearlySummary, setYearlySummary] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: 'monthly' (default) or 'yearly'
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

  // Modals
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

  // Forms
  const [singleForm, setSingleForm] = useState({
    employeeId: '',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    workingDays: '26',
    status: 'DRAFT',
  });

  const [batchForm, setBatchForm] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    workingDays: '26',
    status: 'DRAFT',
  });

  const [payForm, setPayForm] = useState({
    paymentMethod: 'Bank Transfer',
    transactionRef: '',
    paymentNote: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [payRes, empRes] = await Promise.all([
        fetch(`/api/payroll?month=${selectedMonth}&year=${selectedYear}`),
        fetch('/api/employees'),
      ]);
      if (payRes.ok) {
        const d = await payRes.json();
        setPayments(d.payments || []);
        setSummary(d.summary || {});
        setYearlySummary(d.yearlySummary || {});
      }
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(Array.isArray(empData) ? empData : []);
      }
    } catch (e) {
      console.error('Failed to load payroll:', e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Handle Single Payroll Generation
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: singleForm.employeeId,
          month: Number(singleForm.month),
          year: Number(singleForm.year),
          workingDays: Number(singleForm.workingDays),
          status: singleForm.status,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Failed to generate payroll');
        return;
      }
      showToast('Payroll record generated successfully!');
      setShowSingleModal(false);
      loadAll();
    } catch {
      setError('Network connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Batch Payroll Generation
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/payroll/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: Number(batchForm.month),
          year: Number(batchForm.year),
          workingDays: Number(batchForm.workingDays),
          status: batchForm.status,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Failed to run bulk payroll generation');
        return;
      }
      showToast(`Bulk payroll processed: ${d.createdCount ?? 'all'} employees created.`);
      setShowBatchModal(false);
      loadAll();
    } catch {
      setError('Network connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Status Update (e.g. Approve, Pay, Cancel)
  const handleStatusChange = async (id: string, newStatus: string, payload?: any) => {
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...payload,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error || 'Failed to update payroll status', 'error');
        return;
      }
      showToast(`Payroll status updated to ${newStatus}!`);
      loadAll();
    } catch {
      showToast('Network error updating payroll', 'error');
    }
  };

  // Handle Confirm Payment Modal
  const handlePayConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      await handleStatusChange(selectedRecord.id, 'PAID', {
        paymentMethod: payForm.paymentMethod,
        transactionRef: payForm.transactionRef,
        paymentNote: payForm.paymentNote,
      });
      setShowPayModal(false);
      setSelectedRecord(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Payroll Record
  const handleDelete = async (p: PayrollRecord) => {
    const empName = `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.trim() || 'this employee';
    const period = `${MONTHS[p.month - 1]} ${p.year}`;
    if (!confirm(`Are you sure you want to delete the payroll record for ${empName} (${period})?`)) {
      return;
    }

    setDeletingId(p.id);
    try {
      const res = await fetch(`/api/payroll/${p.id}`, {
        method: 'DELETE',
      });
      const d = await res.json();
      if (!res.ok) {
        showToast(d.error || 'Failed to delete payroll record', 'error');
        return;
      }
      showToast('Payroll record deleted successfully!');
      loadAll();
    } catch {
      showToast('Network error deleting payroll record', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(v || 0);

  // Month-specific payments
  const monthlyPayments = useMemo(() => {
    return payments.filter(p => p.month === Number(selectedMonth) && p.year === Number(selectedYear));
  }, [payments, selectedMonth, selectedYear]);

  // Year-specific payments
  const yearlyPayments = useMemo(() => {
    return payments.filter(p => p.year === Number(selectedYear));
  }, [payments, selectedYear]);

  // Filtered Payments for Monthly View
  const filteredMonthlyPayments = useMemo(() => {
    return monthlyPayments.filter(p => {
      const empName = `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.toLowerCase();
      const empId = (p.employee?.employeeId || '').toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch = !q || empName.includes(q) || empId.includes(q);
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [monthlyPayments, search, statusFilter]);

  // Grouped employees for Yearly View
  const groupedYearlyEmployees = useMemo(() => {
    const map = new Map<string, {
      employee: PayrollRecord['employee'];
      records: PayrollRecord[];
      totalBasic: number;
      totalGross: number;
      totalDeductions: number;
      totalNet: number;
      allPaid: boolean;
      activeMonths: number[];
    }>();

    yearlyPayments.forEach(p => {
      const empKey = p.employee?.id || p.employee?.employeeId || p.id;
      if (!map.has(empKey)) {
        map.set(empKey, {
          employee: p.employee,
          records: [],
          totalBasic: 0,
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0,
          allPaid: true,
          activeMonths: [],
        });
      }
      const item = map.get(empKey)!;
      item.records.push(p);
      item.totalBasic += Number(p.basicSalary || 0);
      item.totalGross += Number(p.grossSalary || 0);
      item.totalDeductions += (Number(p.grossSalary || 0) - Number(p.netSalary || 0));
      item.totalNet += Number(p.netSalary || 0);
      if (!item.activeMonths.includes(p.month)) {
        item.activeMonths.push(p.month);
      }
      if (p.status !== 'PAID') {
        item.allPaid = false;
      }
    });

    const list = Array.from(map.values()).map(item => {
      item.records.sort((a, b) => a.month - b.month);
      item.activeMonths.sort((a, b) => a - b);
      return item;
    });

    return list.filter(item => {
      const empName = `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`.toLowerCase();
      const empId = (item.employee?.employeeId || '').toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch = !q || empName.includes(q) || empId.includes(q);

      if (statusFilter === 'ALL') return matchesSearch;
      if (statusFilter === 'PAID') return matchesSearch && item.allPaid && item.records.length > 0;
      if (statusFilter === 'DRAFT') return matchesSearch && item.records.some(r => r.status === 'DRAFT');
      if (statusFilter === 'APPROVED') return matchesSearch && item.records.some(r => r.status === 'APPROVED');
      return matchesSearch && item.records.some(r => r.status === statusFilter);
    });
  }, [yearlyPayments, search, statusFilter]);

  // 12-Month distribution for Yearly View
  const monthlyDistribution = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const mRecords = yearlyPayments.filter(p => p.month === m);
      let mNet = 0, mGross = 0, mBasic = 0, mDeductions = 0, mPaid = 0, mPending = 0;
      mRecords.forEach(p => {
        mBasic += Number(p.basicSalary || 0);
        mGross += Number(p.grossSalary || 0);
        mDeductions += (Number(p.grossSalary || 0) - Number(p.netSalary || 0));
        mNet += Number(p.netSalary || 0);
        if (p.status === 'PAID') mPaid++;
        else if (p.status !== 'CANCELLED') mPending++;
      });
      return {
        month: m,
        name: MONTHS[i],
        records: mRecords,
        count: mRecords.length,
        totalNet: mNet,
        totalGross: mGross,
        totalBasic: mBasic,
        totalDeductions: mDeductions,
        paidCount: mPaid,
        pendingCount: mPending,
      };
    });
  }, [yearlyPayments]);

  const maxMonthNet = useMemo(() => {
    return Math.max(...monthlyDistribution.map(m => m.totalNet), 1);
  }, [monthlyDistribution]);

  // Dynamic KPIs for Monthly and Yearly Views
  const monthlyKPIs = useMemo(() => {
    let basic = 0, bonus = 0, deductions = 0, net = 0, paid = 0, pending = 0;
    monthlyPayments.forEach(p => {
      basic += Number(p.basicSalary || 0);
      bonus += (Number(p.grossSalary || 0) - Number(p.basicSalary || 0));
      deductions += (Number(p.grossSalary || 0) - Number(p.netSalary || 0));
      net += Number(p.netSalary || 0);
      if (p.status === 'PAID') paid++;
      else if (p.status !== 'CANCELLED') pending++;
    });
    return [
      { label: `Base Salary (${MONTHS[Number(selectedMonth) - 1]})`, value: formatCurrency(basic), icon: 'account_balance_wallet', color: '#3b82f6' },
      { label: 'Bonuses & Overtimes', value: formatCurrency(bonus), icon: 'redeem', color: '#10b981' },
      { label: 'Deductions & Fines', value: formatCurrency(deductions), icon: 'money_off', color: '#ef4444' },
      { label: 'Net Disbursable', value: formatCurrency(net), icon: 'payments', color: '#8b5cf6' },
      { label: 'Disbursed Payslips', value: paid, icon: 'check_circle', color: '#10b981' },
      { label: 'Pending Processing', value: pending, icon: 'pending_actions', color: '#f59e0b' },
    ];
  }, [monthlyPayments, selectedMonth]);

  const yearlyKPIs = useMemo(() => {
    let basic = 0, bonus = 0, deductions = 0, net = 0, paid = 0, pending = 0;
    yearlyPayments.forEach(p => {
      basic += Number(p.basicSalary || 0);
      bonus += (Number(p.grossSalary || 0) - Number(p.basicSalary || 0));
      deductions += (Number(p.grossSalary || 0) - Number(p.netSalary || 0));
      net += Number(p.netSalary || 0);
      if (p.status === 'PAID') paid++;
      else if (p.status !== 'CANCELLED') pending++;
    });
    return [
      { label: `Annual Base Salary (${selectedYear})`, value: formatCurrency(basic), icon: 'account_balance_wallet', color: '#3b82f6' },
      { label: 'Annual Bonuses & Overtimes', value: formatCurrency(bonus), icon: 'redeem', color: '#10b981' },
      { label: 'Annual Deductions & Fines', value: formatCurrency(deductions), icon: 'money_off', color: '#ef4444' },
      { label: `Annual Net Disbursed (${selectedYear})`, value: formatCurrency(net), icon: 'payments', color: '#8b5cf6' },
      { label: 'Annual Disbursed Slips', value: paid, icon: 'check_circle', color: '#10b981' },
      { label: 'Annual Pending Slips', value: pending, icon: 'pending_actions', color: '#f59e0b' },
    ];
  }, [yearlyPayments, selectedYear]);

  const activeKPIs = viewMode === 'monthly' ? monthlyKPIs : yearlyKPIs;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '10px',
          background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: '#ffffff',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span className="material-symbols-outlined">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
          {toast.message}
        </div>
      )}

      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
            Payroll & Compensation Hub
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            {viewMode === 'monthly'
              ? `Monthly view · ${MONTHS[Number(selectedMonth) - 1]} ${selectedYear} (${filteredMonthlyPayments.length} records)`
              : `Annual view · Full Year ${selectedYear} (${yearlyPayments.length} total records across ${groupedYearlyEmployees.length} staff)`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View Switcher: Monthly (Default) vs Yearly */}
          <div style={{
            display: 'inline-flex',
            background: 'var(--surface-input, rgba(255, 255, 255, 0.05))',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--border-main)',
            gap: '4px',
          }}>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: viewMode === 'monthly' ? 'var(--primary, #2563eb)' : 'transparent',
                color: viewMode === 'monthly' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: viewMode === 'monthly' ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_month</span>
              Monthly View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('yearly')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: viewMode === 'yearly' ? 'var(--primary, #2563eb)' : 'transparent',
                color: viewMode === 'yearly' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: viewMode === 'yearly' ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>event_repeat</span>
              Yearly View
            </button>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => { setShowBatchModal(true); setError(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_mode</span>
            Batch Run
          </button>

          <button
            className="btn btn-primary"
            onClick={() => { setShowSingleModal(true); setError(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Generate Payroll
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {activeKPIs.map((kpi, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '18px 20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{kpi.label}</span>
              <span className="material-symbols-outlined" style={{ color: kpi.color, fontSize: '20px' }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)' }}>
              {isLoading ? <span style={{ opacity: 0.3 }}>···</span> : kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="glass-card" suppressHydrationWarning style={{ padding: '16px 20px', borderRadius: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div suppressHydrationWarning style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div suppressHydrationWarning style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-input)', border: '1px solid var(--border-main)', borderRadius: '0', padding: '6px 12px', minWidth: '240px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>search</span>
            <input
              type="text"
              placeholder="Search employee name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              suppressHydrationWarning
              style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '13px', outline: 'none', width: '100%' }}
            />
          </div>

          <div suppressHydrationWarning style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {viewMode === 'monthly' ? (
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                suppressHydrationWarning
                style={{ padding: '8px 12px', borderRadius: '0', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '13px' }}
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={String(i + 1)}>{m}</option>
                ))}
              </select>
            ) : (
              <div style={{
                padding: '7px 12px',
                borderRadius: '0',
                background: 'rgba(37, 99, 235, 0.1)',
                color: 'var(--primary)',
                fontWeight: 600,
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(37, 99, 235, 0.25)',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_view_month</span>
                All 12 Months
              </div>
            )}

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              suppressHydrationWarning
              style={{ padding: '8px 12px', borderRadius: '0', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '13px' }}
            >
              {['2024', '2025', '2026', '2027'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {['ALL', 'DRAFT', 'APPROVED', 'PAID'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '0',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: statusFilter === st ? 'var(--primary)' : 'var(--border-main)',
                background: statusFilter === st ? 'var(--primary-subtle)' : 'transparent',
                color: statusFilter === st ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* MONTHLY VIEW: Main Payroll Table */}
      {viewMode === 'monthly' && (
        <div className="glass-card" style={{ borderRadius: '0', overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#10b981', borderBottom: '1px solid #059669' }}>
                  {['Employee', 'Period', 'Basic Salary', 'Gross', 'Deductions', 'Net Payable', 'Status', 'Actions'].map((h, i) => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: i === 7 ? 'right' : 'left', fontWeight: 700, color: '#ffffff', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} style={{ padding: '16px 18px' }}>
                          <div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.6 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredMonthlyPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>payments</span>
                      No payroll records for {MONTHS[Number(selectedMonth) - 1]} {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  filteredMonthlyPayments.map(p => {
                    const sc = statusColors[p.status] || { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' };
                    const deductions = Number(p.grossSalary) - Number(p.netSalary);

                    return (
                      <tr
                        key={p.id}
                        onClick={() => router.push(`/erp/hr/payroll/review/${p.id}`)}
                        style={{ borderBottom: '1px solid var(--border-main)', cursor: 'pointer', transition: 'background 0.15s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                        title="Click to view detailed payroll review"
                      >
                        <td style={{ padding: '8px 12px' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {p.employee?.firstName} {p.employee?.lastName}
                              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)', opacity: 0.8 }}>
                                open_in_new
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {p.employee?.designationRef?.name || p.employee?.designation || 'Staff'} · <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{p.employee?.employeeId}</span>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {MONTHS[p.month - 1]} {p.year}
                        </td>

                        <td style={{ padding: '8px 12px', color: 'var(--text-main)', fontWeight: 500 }}>
                          {formatCurrency(Number(p.basicSalary))}
                        </td>

                        <td style={{ padding: '8px 12px', color: 'var(--text-main)', fontWeight: 500 }}>
                          {formatCurrency(Number(p.grossSalary))}
                        </td>

                        <td style={{ padding: '8px 12px', color: '#ef4444', fontWeight: 500 }}>
                          -{formatCurrency(deductions)}
                        </td>

                        <td style={{ padding: '8px 12px', color: 'var(--success)', fontWeight: 700, fontSize: '14px' }}>
                          {formatCurrency(Number(p.netSalary))}
                        </td>

                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '0',
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            color: sc.color,
                            background: sc.bg,
                            border: `1px solid ${sc.border}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            {p.status}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Link
                              href={`/erp/hr/payroll/review/${p.id}`}
                              className="btn btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '12px', color: 'var(--primary, #3b82f6)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="View Details & Audit Review"
                              onClick={e => e.stopPropagation()}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                              <span>View</span>
                            </Link>

                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedRecord(p); setShowPayslipModal(true); }}
                              className="btn btn-secondary"
                              style={{ padding: '5px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center' }}
                              title="View Payslip"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>receipt_long</span>
                            </button>

                            {p.status === 'DRAFT' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(p.id, 'APPROVED'); }}
                                className="btn btn-secondary"
                                style={{ padding: '5px 8px', fontSize: '12px', color: '#3b82f6', display: 'inline-flex', alignItems: 'center' }}
                                title="Approve Payroll"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                              </button>
                            )}

                            {p.status === 'APPROVED' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedRecord(p); setShowPayModal(true); }}
                                className="btn btn-primary"
                                style={{ padding: '5px 12px', fontSize: '12px' }}
                                title="Disburse / Mark Paid"
                              >
                                Pay
                              </button>
                            )}

                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                              disabled={deletingId === p.id}
                              className="btn btn-secondary"
                              style={{
                                padding: '5px 8px',
                                fontSize: '12px',
                                color: '#ef4444',
                                borderColor: 'rgba(239, 68, 68, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                opacity: deletingId === p.id ? 0.6 : 1,
                              }}
                              title="Delete Payroll Record"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
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
        </div>
      )}

      {/* YEARLY VIEW: 12-Month Matrix & Annual Employee Register */}
      {viewMode === 'yearly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 1. 12-Month Distribution Matrix */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
                  12-Month Compensation Matrix ({selectedYear})
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Click "Inspect Month" on any card to switch directly to its detailed monthly records.
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '14px',
            }}>
              {monthlyDistribution.map(m => {
                const percent = Math.min(100, Math.round((m.totalNet / maxMonthNet) * 100));
                const isSelected = String(m.month) === selectedMonth;

                return (
                  <div
                    key={m.month}
                    className="glass-card"
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-main)',
                      background: isSelected ? 'rgba(37, 99, 235, 0.05)' : undefined,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {m.name} {selectedYear}
                      </span>
                      {m.count === 0 ? (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: 'var(--surface-hover)', color: 'var(--text-muted)' }}>
                          No Run
                        </span>
                      ) : m.pendingCount === 0 ? (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          ✓ All Paid
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          ⏳ {m.pendingCount} Pending
                        </span>
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: m.totalNet > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                        {formatCurrency(m.totalNet)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {m.count > 0 ? `${m.count} staff · Gross ${formatCurrency(m.totalGross)}` : 'No payments processed'}
                      </div>
                    </div>

                    {/* Volume Bar */}
                    <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'var(--surface-hover)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${m.totalNet > 0 ? Math.max(percent, 8) : 0}%`,
                        height: '100%',
                        borderRadius: '3px',
                        background: m.pendingCount > 0 ? 'linear-gradient(90deg, #f59e0b, #eab308)' : 'linear-gradient(90deg, #10b981, #059669)',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonth(String(m.month));
                        setViewMode('monthly');
                      }}
                      className="btn btn-secondary"
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '2px',
                      }}
                    >
                      <span>Inspect Month</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Annual Staff Payroll Register Table */}
          <div className="glass-card" style={{ borderRadius: '0', overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Annual Staff Payroll Register ({selectedYear})
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Cumulative compensation, deductions, and active months per staff member.
                </p>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {groupedYearlyEmployees.length} staff processed
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#10b981', borderBottom: '1px solid #059669' }}>
                    <th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#ffffff', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Staff Member</th>
                    <th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#ffffff', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Active Months</th>
                    <th style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: '#ffffff', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Annual Basic</th>
                    <th style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: '#ffffff', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Annual Gross</th>
                    <th style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: '#ffffff', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Annual Deductions</th>
                    <th style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: '#ffffff', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Annual Net Paid</th>
                    <th style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: '#ffffff', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Avg / Month</th>
                    <th style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 700, color: '#ffffff', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 700, color: '#ffffff', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} style={{ padding: '12px 18px' }}>
                            <div style={{ height: '14px', borderRadius: '4px', background: 'var(--surface-hover)', opacity: 0.6 }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : groupedYearlyEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>event_repeat</span>
                        No yearly payroll records found for {selectedYear}.
                      </td>
                    </tr>
                  ) : (
                    groupedYearlyEmployees.map(empGroup => {
                      const empKey = empGroup.employee?.id || empGroup.employee?.employeeId || '';
                      const isExpanded = expandedEmpId === empKey;
                      const avgNet = empGroup.records.length > 0 ? Math.round(empGroup.totalNet / empGroup.records.length) : 0;

                      return (
                        <React.Fragment key={empKey}>
                          <tr
                            style={{
                              borderBottom: '1px solid var(--border-main)',
                              background: isExpanded ? 'rgba(37, 99, 235, 0.04)' : undefined,
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                            onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = ''; }}
                          >
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: 'var(--primary-subtle)',
                                  color: 'var(--primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  flexShrink: 0,
                                }}>
                                  {empGroup.employee?.firstName?.[0] || 'S'}{empGroup.employee?.lastName?.[0] || ''}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                    {empGroup.employee?.firstName} {empGroup.employee?.lastName}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {empGroup.employee?.designationRef?.name || empGroup.employee?.designation || 'Staff'} · <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{empGroup.employee?.employeeId}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                                  {empGroup.records.length} / 12 Months
                                </span>
                                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                                  {MONTHS.map((mName, i) => {
                                    const mNum = i + 1;
                                    const hasRec = empGroup.activeMonths.includes(mNum);
                                    return (
                                      <span
                                        key={mNum}
                                        title={`${mName}: ${hasRec ? 'Processed' : 'Not generated'}`}
                                        style={{
                                          width: '18px',
                                          height: '18px',
                                          borderRadius: '0',
                                          fontSize: '9px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: 700,
                                          background: hasRec ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface-hover)',
                                          color: hasRec ? '#10b981' : 'var(--text-muted)',
                                          border: hasRec ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                                        }}
                                      >
                                        {mName[0]}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-main)', fontWeight: 500 }}>
                              {formatCurrency(empGroup.totalBasic)}
                            </td>

                            <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-main)', fontWeight: 500 }}>
                              {formatCurrency(empGroup.totalGross)}
                            </td>

                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#ef4444', fontWeight: 500 }}>
                              -{formatCurrency(empGroup.totalDeductions)}
                            </td>

                            <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--success)', fontWeight: 800, fontSize: '14px' }}>
                              {formatCurrency(empGroup.totalNet)}
                            </td>

                            <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 500 }}>
                              {formatCurrency(avgNet)}
                            </td>

                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              {empGroup.allPaid ? (
                                <span style={{ padding: '3px 8px', borderRadius: '0', fontSize: '0.725rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                  ALL PAID
                                </span>
                              ) : (
                                <span style={{ padding: '3px 8px', borderRadius: '0', fontSize: '0.725rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                  HAS PENDING
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setExpandedEmpId(isExpanded ? null : empKey)}
                                className="btn btn-secondary"
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                  {isExpanded ? 'expand_less' : 'expand_more'}
                                </span>
                                <span>{isExpanded ? 'Close' : 'Months'}</span>
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Sub-Table for Employee Monthly Records */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} style={{ padding: '16px 24px', background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>history</span>
                                    <span>Monthly Payslip History in {selectedYear} for {empGroup.employee?.firstName} {empGroup.employee?.lastName}</span>
                                  </div>

                                  <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-card)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                      <thead>
                                        <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Month</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Basic</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Gross</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Deductions</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Net Salary</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Disbursal</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {empGroup.records.map(rec => {
                                          const sc = statusColors[rec.status] || { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' };
                                          const ded = Number(rec.grossSalary) - Number(rec.netSalary);
                                          return (
                                            <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                                              <td style={{ padding: '10px 14px', fontWeight: 600 }}>{MONTHS[rec.month - 1]} {rec.year}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>{formatCurrency(Number(rec.basicSalary))}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>{formatCurrency(Number(rec.grossSalary))}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'right', color: '#ef4444' }}>-{formatCurrency(ded)}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(Number(rec.netSalary))}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                                                  {rec.status}
                                                </span>
                                              </td>
                                              <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                                                {rec.paymentDate ? `${new Date(rec.paymentDate).toLocaleDateString()} (${rec.paymentMethod || 'Paid'})` : '—'}
                                              </td>
                                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                  <Link
                                                    href={`/erp/hr/payroll/review/${rec.id}`}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '3px 8px', fontSize: '11px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                  >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>visibility</span>
                                                    <span>Review</span>
                                                  </Link>
                                                  <button
                                                    onClick={() => { setSelectedRecord(rec); setShowPayslipModal(true); }}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '3px 6px', fontSize: '11px' }}
                                                    title="Payslip"
                                                  >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>receipt_long</span>
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Single Generate Modal */}
      {showSingleModal && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowSingleModal(false); }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', borderRadius: '20px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Generate Single Payroll</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Calculates fine/advance deductions, bonuses, and net pay automatically.</p>
              </div>
              <button onClick={() => setShowSingleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && <div style={errorBannerStyle}>⚠ {error}</div>}

            <form onSubmit={handleSingleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Employee *</label>
                <select
                  value={singleForm.employeeId}
                  onChange={e => setSingleForm(f => ({ ...f, employeeId: e.target.value }))}
                  required
                  style={inputStyle}
                >
                  <option value="">— Select Employee —</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Month *</label>
                  <select
                    value={singleForm.month}
                    onChange={e => setSingleForm(f => ({ ...f, month: e.target.value }))}
                    required
                    style={inputStyle}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i + 1} value={String(i + 1)}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Year *</label>
                  <input
                    type="number"
                    value={singleForm.year}
                    onChange={e => setSingleForm(f => ({ ...f, year: e.target.value }))}
                    min="2020"
                    max="2035"
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Standard Working Days *</label>
                  <input
                    type="number"
                    value={singleForm.workingDays}
                    onChange={e => setSingleForm(f => ({ ...f, workingDays: e.target.value }))}
                    min="1"
                    max="31"
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Initial Status</label>
                  <select
                    value={singleForm.status}
                    onChange={e => setSingleForm(f => ({ ...f, status: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="APPROVED">Approved</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSingleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Calculating…' : 'Generate Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Generate Modal */}
      {showBatchModal && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowBatchModal(false); }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', borderRadius: '20px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Batch Generate Payroll</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Generate records for all active employees simultaneously.</p>
              </div>
              <button onClick={() => setShowBatchModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && <div style={errorBannerStyle}>⚠ {error}</div>}

            <form onSubmit={handleBatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Target Month *</label>
                  <select
                    value={batchForm.month}
                    onChange={e => setBatchForm(f => ({ ...f, month: e.target.value }))}
                    required
                    style={inputStyle}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i + 1} value={String(i + 1)}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Target Year *</label>
                  <input
                    type="number"
                    value={batchForm.year}
                    onChange={e => setBatchForm(f => ({ ...f, year: e.target.value }))}
                    min="2020"
                    max="2035"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Monthly Working Days *</label>
                <input
                  type="number"
                  value={batchForm.workingDays}
                  onChange={e => setBatchForm(f => ({ ...f, workingDays: e.target.value }))}
                  min="1"
                  max="31"
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBatchModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Running Batch…' : 'Run Full Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Disbursement Modal */}
      {showPayModal && selectedRecord && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowPayModal(false); }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Disburse Salary</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Pay <strong>{selectedRecord.employee.firstName} {selectedRecord.employee.lastName}</strong>
                </p>
              </div>
              <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'var(--surface-hover)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Net Disbursal Amount:</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>
                {formatCurrency(Number(selectedRecord.netSalary))}
              </span>
            </div>

            <form onSubmit={handlePayConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Payment Method *</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  required
                  style={inputStyle}
                >
                  <option value="Bank Transfer">Bank Transfer (EFT/NPSB)</option>
                  <option value="bKash Corporate">bKash Corporate</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Cash in Hand">Cash in Hand</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Transaction / Check Ref</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-8921831 or Check #44102"
                  value={payForm.transactionRef}
                  onChange={e => setPayForm(f => ({ ...f, transactionRef: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Disbursed via City Bank corporate portal"
                  value={payForm.paymentNote}
                  onChange={e => setPayForm(f => ({ ...f, paymentNote: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Recording…' : 'Confirm & Post Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Payslip Modal */}
      {showPayslipModal && selectedRecord && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowPayslipModal(false); }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '680px', borderRadius: '20px', padding: '32px', background: '#ffffff', color: '#1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  SHOHOJ LEDGER ENTERPRISE
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>CONFIDENTIAL SALARY PAYSLIP</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>
                  Period: {MONTHS[selectedRecord.month - 1]} {selectedRecord.year}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Generated: {new Date(selectedRecord.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Employee Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Employee Name: </span>
                <strong style={{ color: '#0f172a' }}>{selectedRecord.employee.firstName} {selectedRecord.employee.lastName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Employee ID: </span>
                <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{selectedRecord.employee.employeeId}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Designation: </span>
                <strong style={{ color: '#0f172a' }}>{selectedRecord.employee.designationRef?.name || selectedRecord.employee.designation || 'Staff'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Payment Status: </span>
                <strong style={{ color: selectedRecord.status === 'PAID' ? '#10b981' : '#f59e0b' }}>{selectedRecord.status}</strong>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '16px 0' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '8px' }}>
                  EARNINGS & ALLOWANCES
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0' }}>
                  <span style={{ color: '#64748b' }}>Basic Salary</span>
                  <span style={{ fontWeight: 600 }}>৳{Number(selectedRecord.basicSalary).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0' }}>
                  <span style={{ color: '#64748b' }}>Bonuses & Overtimes</span>
                  <span style={{ fontWeight: 600 }}>৳{(Number(selectedRecord.grossSalary) - Number(selectedRecord.basicSalary)).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderTop: '1px dashed #cbd5e1', marginTop: '8px', fontWeight: 700 }}>
                  <span>Gross Earnings</span>
                  <span>৳{Number(selectedRecord.grossSalary).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '8px' }}>
                  DEDUCTIONS & RECOVERIES
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0' }}>
                  <span style={{ color: '#64748b' }}>Fines / Leaves / Advances</span>
                  <span style={{ fontWeight: 600, color: '#ef4444' }}>-৳{(Number(selectedRecord.grossSalary) - Number(selectedRecord.netSalary)).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderTop: '1px dashed #cbd5e1', marginTop: '8px', fontWeight: 700 }}>
                  <span>Total Deductions</span>
                  <span style={{ color: '#ef4444' }}>-৳{(Number(selectedRecord.grossSalary) - Number(selectedRecord.netSalary)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Banner */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Net Disbursable Salary</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Payment Method: {selectedRecord.paymentMethod || 'Bank Transfer'}</div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>
                ৳{Number(selectedRecord.netSalary).toLocaleString()}
              </div>
            </div>

            {/* Print & Close Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setShowPayslipModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
                Print Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(6px)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid var(--border-main)',
  background: 'var(--surface-input)',
  color: 'var(--text-main)',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const errorBannerStyle: React.CSSProperties = {
  marginBottom: '16px',
  padding: '12px 16px',
  borderRadius: '10px',
  background: 'var(--danger-subtle)',
  color: 'var(--danger)',
  fontSize: '13px',
  fontWeight: 500,
};
