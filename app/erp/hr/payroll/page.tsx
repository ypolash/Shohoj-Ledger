"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

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
  const [payments, setPayments] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(v || 0);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const empName = `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.toLowerCase();
      const empId = (p.employee?.employeeId || '').toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch = !q || empName.includes(q) || empId.includes(q);
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

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
            Automated salary calculations with fines, advances, overtimes, task rewards, and ledger integration.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
        {[
          { label: 'Total Base Salary', value: formatCurrency(summary.totalSalary), icon: 'account_balance_wallet', color: '#3b82f6' },
          { label: 'Bonuses & Overtimes', value: formatCurrency(summary.totalBonus), icon: 'redeem', color: '#10b981' },
          { label: 'Deductions & Fines', value: formatCurrency(summary.totalDeductions), icon: 'money_off', color: '#ef4444' },
          { label: 'Net Disbursable', value: formatCurrency(summary.totalNetPay), icon: 'payments', color: '#8b5cf6' },
          { label: 'Disbursed Payslips', value: summary.processedCount ?? 0, icon: 'check_circle', color: '#10b981' },
          { label: 'Pending Processing', value: summary.pendingCount ?? 0, icon: 'pending_actions', color: '#f59e0b' },
        ].map((kpi, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '18px 20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{kpi.label}</span>
              <span className="material-symbols-outlined" style={{ color: kpi.color, fontSize: '20px' }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-input)', border: '1px solid var(--border-main)', borderRadius: '10px', padding: '6px 12px', minWidth: '240px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>search</span>
            <input
              type="text"
              placeholder="Search employee name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '13px', outline: 'none', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '13px' }}
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={String(i + 1)}>{m}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '13px' }}
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
                borderRadius: '8px',
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

      {/* Main Table */}
      <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                {['Employee', 'Period', 'Basic Salary', 'Gross', 'Deductions', 'Net Payable', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: i === 7 ? 'right' : 'left', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
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
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>payments</span>
                    No payroll records match the selected month/filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => {
                  const sc = statusColors[p.status] || { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' };
                  const deductions = Number(p.grossSalary) - Number(p.netSalary);

                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '1px solid var(--border-main)', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {p.employee?.firstName} {p.employee?.lastName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {p.employee?.designationRef?.name || p.employee?.designation || 'Staff'} · <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{p.employee?.employeeId}</span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {MONTHS[p.month - 1]} {p.year}
                      </td>

                      <td style={{ padding: '14px 18px', color: 'var(--text-main)', fontWeight: 500 }}>
                        {formatCurrency(Number(p.basicSalary))}
                      </td>

                      <td style={{ padding: '14px 18px', color: 'var(--text-main)', fontWeight: 500 }}>
                        {formatCurrency(Number(p.grossSalary))}
                      </td>

                      <td style={{ padding: '14px 18px', color: '#ef4444', fontWeight: 500 }}>
                        -{formatCurrency(deductions)}
                      </td>

                      <td style={{ padding: '14px 18px', color: 'var(--success)', fontWeight: 700, fontSize: '14px' }}>
                        {formatCurrency(Number(p.netSalary))}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
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

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => { setSelectedRecord(p); setShowPayslipModal(true); }}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            title="View Payslip"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>receipt_long</span>
                          </button>

                          {p.status === 'DRAFT' && (
                            <button
                              onClick={() => handleStatusChange(p.id, 'APPROVED')}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '12px', color: '#3b82f6' }}
                              title="Approve Payroll"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                            </button>
                          )}

                          {p.status === 'APPROVED' && (
                            <button
                              onClick={() => { setSelectedRecord(p); setShowPayModal(true); }}
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              title="Disburse / Mark Paid"
                            >
                              Pay
                            </button>
                          )}
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
