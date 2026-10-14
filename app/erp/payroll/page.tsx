"use client";

import React, { useState, useEffect } from 'react';

interface PayrollRecord {
  id: string; month: number; year: number;
  basicSalary: number; grossSalary: number; netSalary: number;
  status: string; createdAt: string;
  paymentDate?: string; paymentMethod?: string; transactionRef?: string;
  employee: { firstName: string; lastName: string; designation: string; employeeId: string };
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_META: Record<string, { color: string; bg: string; next?: string; nextLabel?: string; nextIcon?: string }> = {
  DRAFT:      { color: 'var(--text-muted)',   bg: 'var(--surface-hover)',    next: 'SUBMITTED',  nextLabel: 'Submit',   nextIcon: 'send' },
  SUBMITTED:  { color: 'var(--accent)',       bg: 'var(--primary-subtle)',   next: 'APPROVED',   nextLabel: 'Approve',  nextIcon: 'verified' },
  APPROVED:   { color: 'var(--primary)',      bg: 'var(--primary-subtle)',   next: 'PAID',       nextLabel: 'Mark Paid',nextIcon: 'paid' },
  PAID:       { color: 'var(--success)',      bg: 'var(--success-subtle)',   next: 'LOCKED',     nextLabel: 'Lock',     nextIcon: 'lock' },
  LOCKED:     { color: 'var(--warning)',      bg: 'var(--warning-subtle)' },
  ARCHIVED:   { color: 'var(--text-muted)',   bg: 'var(--surface-hover)' },
  CANCELLED:  { color: 'var(--danger)',       bg: 'var(--danger-subtle)' },
};

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Cheque', 'Mobile Banking'];

/**
 * ERP Payroll — Overview Page
 * Full payroll management dashboard: summary KPIs, month/year filtering,
 * per-record status workflow transitions, and multi-select bulk actions.
 * APIs: GET /api/payroll, PATCH /api/payroll/[id], PATCH /api/payroll/bulk
 */
export default function PayrollOverviewPage() {
  const [payments, setPayments] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [yearlySummary, setYearlySummary] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: 'monthly' (default) or 'yearly'
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear]   = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedEmpKey, setExpandedEmpKey] = useState<string | null>(null);

  // Payment modal state (for PAID transition)
  const [payModal, setPayModal]   = useState<{ id: string; name: string; amount: number } | null>(null);
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payRef, setPayRef]       = useState('');
  const [payNote, setPayNote]     = useState('');
  const [paying, setPaying]       = useState(false);

  useEffect(() => { loadPayroll(); }, [filterMonth, filterYear]);

  /** Loads payroll records for the selected month/year from /api/payroll */
  const loadPayroll = async () => {
    setIsLoading(true);
    setSelectedIds(new Set());
    try {
      const res = await fetch(`/api/payroll?month=${filterMonth}&year=${filterYear}`);
      if (res.ok) {
        const d = await res.json();
        setPayments(d.payments || []);
        setSummary(d.summary || {});
        setYearlySummary(d.yearlySummary || {});
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  /** Advances a single payroll record to the next status in the workflow */
  const handleStatusTransition = async (id: string, nextStatus: string, name: string, amount: number) => {
    if (nextStatus === 'PAID') {
      setPayModal({ id, name, amount });
      return;
    }
    setActionLoading(id);
    try {
      await fetch(`/api/payroll/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      loadPayroll();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  /** Deletes a single payroll record */
  const handleDeleteRecord = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the payroll record for ${name}?`)) return;
    setActionLoading(id);
    try {
      await fetch(`/api/payroll/${id}`, { method: 'DELETE' });
      loadPayroll();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  /** Confirms payment with payment details */
  const confirmPayment = async () => {
    if (!payModal) return;
    setPaying(true);
    try {
      await fetch(`/api/payroll/${payModal.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID', paymentMethod: payMethod, transactionRef: payRef, paymentNote: payNote }),
      });
      setPayModal(null); setPayRef(''); setPayNote('');
      loadPayroll();
    } catch (e) { console.error(e); }
    finally { setPaying(false); }
  };

  /** Applies a bulk status transition to all selected records */
  const handleBulkAction = async (status: string) => {
    if (selectedIds.size === 0) return;
    setActionLoading('bulk');
    try {
      await fetch('/api/payroll/bulk', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIds: Array.from(selectedIds), status }),
      });
      loadPayroll();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredMonthly.length && filteredMonthly.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredMonthly.map(p => p.id)));
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(v || 0);

  // Filtered lists
  const monthlyPayments = payments.filter(p => p.month === filterMonth && p.year === filterYear);
  const yearlyPayments = payments.filter(p => p.year === filterYear);

  const filteredMonthly = filterStatus
    ? monthlyPayments.filter(p => p.status === filterStatus)
    : monthlyPayments;

  // Monthly totals
  const monthlyTotals = (() => {
    let basic = 0, bonus = 0, deductions = 0, net = 0, paid = 0, pending = 0;
    monthlyPayments.forEach(p => {
      basic += Number(p.basicSalary || 0);
      bonus += (Number(p.grossSalary || 0) - Number(p.basicSalary || 0));
      deductions += (Number(p.grossSalary || 0) - Number(p.netSalary || 0));
      net += Number(p.netSalary || 0);
      if (p.status === 'PAID') paid++;
      else if (p.status !== 'CANCELLED') pending++;
    });
    return {
      basic: basic || summary.totalSalary || 0,
      bonus: bonus || summary.totalBonus || 0,
      deductions: deductions || summary.totalDeductions || 0,
      net: net || summary.totalNetPay || 0,
      paid: paid || summary.processedCount || 0,
      pending: pending || summary.pendingCount || 0,
    };
  })();

  // Yearly totals
  const yearlyTotals = (() => {
    let basic = 0, bonus = 0, deductions = 0, net = 0, paid = 0, pending = 0;
    yearlyPayments.forEach(p => {
      basic += Number(p.basicSalary || 0);
      bonus += (Number(p.grossSalary || 0) - Number(p.basicSalary || 0));
      deductions += (Number(p.grossSalary || 0) - Number(p.netSalary || 0));
      net += Number(p.netSalary || 0);
      if (p.status === 'PAID') paid++;
      else if (p.status !== 'CANCELLED') pending++;
    });
    return {
      basic: basic || yearlySummary.totalSalary || 0,
      bonus: bonus || yearlySummary.totalBonus || 0,
      deductions: deductions || yearlySummary.totalDeductions || 0,
      net: net || yearlySummary.totalNetPay || 0,
      paid: paid || yearlySummary.processedCount || 0,
      pending: pending || yearlySummary.pendingCount || 0,
    };
  })();

  // 12-Month distribution for yearly view
  const monthlyDistribution = Array.from({ length: 12 }, (_, i) => {
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

  const maxMonthNet = Math.max(...monthlyDistribution.map(m => m.totalNet), 1);

  // Grouped employees for yearly register
  const groupedYearlyEmployees = (() => {
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
      const empKey = p.employee?.employeeId || p.employee?.firstName + p.employee?.lastName;
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
      if (!item.activeMonths.includes(p.month)) item.activeMonths.push(p.month);
      if (p.status !== 'PAID') item.allPaid = false;
    });

    const list = Array.from(map.values()).map(item => {
      item.records.sort((a, b) => a.month - b.month);
      item.activeMonths.sort((a, b) => a - b);
      return item;
    });

    if (!filterStatus) return list;
    if (filterStatus === 'PAID') return list.filter(item => item.allPaid);
    return list.filter(item => item.records.some(r => r.status === filterStatus));
  })();

  const monthlyKpis = [
    { label: 'Total Records',   value: monthlyPayments.length,             icon: 'receipt_long',    color: 'var(--text-main)' },
    { label: 'Total Net Pay',   value: fmt(monthlyTotals.net),             icon: 'payments',        color: 'var(--success)' },
    { label: 'Total Basic',     value: fmt(monthlyTotals.basic),           icon: 'account_balance',  color: 'var(--primary)' },
    { label: 'Total Bonus',     value: fmt(monthlyTotals.bonus),           icon: 'star',            color: 'var(--accent)' },
    { label: 'Total Deductions',value: fmt(monthlyTotals.deductions),       icon: 'remove_circle',   color: 'var(--danger)' },
    { label: 'Pending',         value: monthlyTotals.pending,              icon: 'pending_actions', color: 'var(--warning)' },
    { label: 'Paid',            value: monthlyTotals.paid,                 icon: 'check_circle',    color: 'var(--success)' },
  ];

  const yearlyKpis = [
    { label: `Total Records (${filterYear})`, value: yearlyPayments.length, icon: 'receipt_long',   color: 'var(--text-main)' },
    { label: 'Annual Net Pay',  value: fmt(yearlyTotals.net),              icon: 'payments',        color: 'var(--success)' },
    { label: 'Annual Basic',    value: fmt(yearlyTotals.basic),            icon: 'account_balance',  color: 'var(--primary)' },
    { label: 'Annual Bonus',    value: fmt(yearlyTotals.bonus),            icon: 'star',            color: 'var(--accent)' },
    { label: 'Annual Deductions',value: fmt(yearlyTotals.deductions),      icon: 'remove_circle',   color: 'var(--danger)' },
    { label: 'Annual Pending',  value: yearlyTotals.pending,               icon: 'pending_actions', color: 'var(--warning)' },
    { label: 'Annual Paid',     value: yearlyTotals.paid,                  icon: 'check_circle',    color: 'var(--success)' },
  ];

  const activeKpis = viewMode === 'monthly' ? monthlyKpis : yearlyKpis;
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Payroll Overview</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            {viewMode === 'monthly'
              ? `Monthly view · ${MONTHS[filterMonth - 1]} ${filterYear} (${monthlyPayments.length} records)`
              : `Annual view · Full Year ${filterYear} (${yearlyPayments.length} total records across ${groupedYearlyEmployees.length} staff)`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                padding: '6px 14px',
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
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
              Monthly View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('yearly')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
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
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>event_repeat</span>
              Yearly View
            </button>
          </div>

          {/* Month/Year picker */}
          <div className="glass-panel" style={{ display: 'flex', gap: '8px', padding: '6px 12px', borderRadius: '12px', alignItems: 'center' }}>
            {viewMode === 'monthly' ? (
              <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '13px' }}>
                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            ) : (
              <div style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', fontWeight: 600, fontSize: '12px' }}>
                All 12 Months
              </div>
            )}
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '13px' }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <button onClick={loadPayroll} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 'var(--spacing-3)' }}>
        {activeKpis.map(kpi => (
          <div key={kpi.label} className="glass-panel" style={{ padding: '18px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: kpi.color }}>{kpi.icon}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: kpi.color }}>
              {isLoading ? <span style={{ opacity: 0.3 }}>···</span> : kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Status filter + bulk actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {['', 'DRAFT', 'SUBMITTED', 'APPROVED', 'PAID', 'LOCKED', 'CANCELLED'].map(s => {
          const isActive = filterStatus === s;
          return (
            <button key={s || 'all'} onClick={() => setFilterStatus(s)}
              style={{ padding: '7px 14px', borderRadius: '20px', border: `2px solid ${isActive ? 'var(--primary)' : 'var(--border-main)'}`, background: isActive ? 'var(--primary-subtle)' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}>
              {s || 'All'}
            </button>
          );
        })}

        {viewMode === 'monthly' && selectedIds.size > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center', padding: '6px 14px', borderRadius: '12px', background: 'var(--primary-subtle)', border: '1px solid var(--primary)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>{selectedIds.size} selected</span>
            {['SUBMITTED', 'APPROVED', 'CANCELLED'].map(s => (
              <button key={s} onClick={() => handleBulkAction(s)} disabled={actionLoading === 'bulk'}
                style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', background: s === 'CANCELLED' ? 'var(--danger-subtle)' : 'var(--primary)', color: s === 'CANCELLED' ? 'var(--danger)' : 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                {s === 'CANCELLED' ? '✗ Cancel' : `→ ${s}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MONTHLY VIEW: Main Table */}
      {viewMode === 'monthly' && (
        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                  <th style={{ padding: '12px 16px', width: '40px' }}>
                    <input type="checkbox" checked={selectedIds.size === filteredMonthly.length && filteredMonthly.length > 0} onChange={toggleAll}
                      style={{ cursor: 'pointer', accentColor: 'var(--primary)' }} />
                  </th>
                  {['Employee', 'Basic', 'Gross', 'Net Pay', 'Status', 'Payment', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}><div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.7 }} /></td>
                    ))}
                  </tr>
                )) : filteredMonthly.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>payments</span>
                    No payroll records for {MONTHS[filterMonth - 1]} {filterYear}.
                    <div style={{ marginTop: '12px' }}>
                      <a href="/erp/payroll/run" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                        → Generate individual payroll
                      </a>
                      {' · '}
                      <a href="/erp/payroll/bulk" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                        → Bulk generate for all employees
                      </a>
                    </div>
                  </td></tr>
                ) : filteredMonthly.map(p => {
                  const meta = STATUS_META[p.status] || { color: 'var(--text-muted)', bg: 'var(--surface-hover)' };
                  const isSelected = selectedIds.has(p.id);
                  const isActing = actionLoading === p.id;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-main)', background: isSelected ? 'var(--primary-subtle)' : '' }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = ''; }}>
                      <td style={{ padding: '14px 16px' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)}
                          style={{ cursor: 'pointer', accentColor: 'var(--primary)' }} />
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                              {p.employee?.firstName?.[0]}{p.employee?.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <div>{p.employee?.firstName} {p.employee?.lastName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--primary)', fontFamily: 'monospace' }}>{p.employee?.employeeId}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.employee?.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>৳{Number(p.basicSalary).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>৳{Number(p.grossSalary).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--success)', fontSize: '15px' }}>৳{Number(p.netSalary).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: meta.color, background: meta.bg }}>{p.status}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {p.paymentDate ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--success)' }}>{new Date(p.paymentDate).toLocaleDateString()}</div>
                            <div>{p.paymentMethod}</div>
                            {p.transactionRef && <div style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{p.transactionRef}</div>}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {meta.next && (
                            <button
                              onClick={() => handleStatusTransition(p.id, meta.next!, `${p.employee?.firstName} ${p.employee?.lastName}`, Number(p.netSalary))}
                              disabled={isActing}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', border: 'none', background: meta.next === 'PAID' ? 'var(--success)' : meta.next === 'LOCKED' ? 'var(--warning-subtle)' : 'var(--primary)', color: meta.next === 'LOCKED' ? 'var(--warning)' : 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: isActing ? 0.6 : 1 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{meta.nextIcon}</span>
                              {isActing ? '…' : meta.nextLabel}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRecord(p.id, `${p.employee?.firstName} ${p.employee?.lastName}`)}
                            disabled={isActing}
                            title="Delete Payroll Record"
                            style={{ display: 'flex', alignItems: 'center', padding: '7px 8px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'transparent', color: '#ef4444', fontSize: '12px', cursor: 'pointer', opacity: isActing ? 0.6 : 1 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
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
      )}

      {/* YEARLY VIEW: 12-Month Distribution Matrix & Annual Staff Register */}
      {viewMode === 'yearly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 1. 12-Month Distribution Matrix */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
                  12-Month Payroll Matrix ({filterYear})
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Monthly compensation distribution. Click "Inspect Month" to drill into that month.
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
                const isSelected = m.month === filterMonth;

                return (
                  <div
                    key={m.month}
                    className="glass-panel"
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-main)',
                      background: isSelected ? 'rgba(37, 99, 235, 0.05)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {m.name} {filterYear}
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
                      <div style={{ fontSize: '18px', fontWeight: 800, color: m.totalNet > 0 ? 'var(--success)' : 'var(--text-main)' }}>
                        ৳{m.totalNet.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {m.count > 0 ? `${m.count} records · Gross ৳${m.totalGross.toLocaleString()}` : 'No payments'}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'var(--surface-hover)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${m.totalNet > 0 ? Math.max(percent, 8) : 0}%`,
                        height: '100%',
                        borderRadius: '3px',
                        background: m.pendingCount > 0 ? 'linear-gradient(90deg, #f59e0b, #eab308)' : 'linear-gradient(90deg, #10b981, #059669)',
                      }} />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFilterMonth(m.month);
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
          <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Annual Employee Payroll Register ({filterYear})
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Full-year compensation summary across all active staff.
                </p>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {groupedYearlyEmployees.length} staff processed
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                    <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Staff Member</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Active Months</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Annual Basic</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Annual Gross</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Annual Deductions</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Annual Net Paid</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Avg / Month</th>
                    <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} style={{ padding: '16px 18px' }}>
                            <div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.6 }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : groupedYearlyEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>event_repeat</span>
                        No yearly payroll records found for {filterYear}.
                      </td>
                    </tr>
                  ) : (
                    groupedYearlyEmployees.map(empGroup => {
                      const empKey = empGroup.employee?.employeeId || empGroup.employee?.firstName;
                      const isExpanded = expandedEmpKey === empKey;
                      const avgNet = empGroup.records.length > 0 ? Math.round(empGroup.totalNet / empGroup.records.length) : 0;

                      return (
                        <React.Fragment key={empKey}>
                          <tr
                            style={{
                              borderBottom: '1px solid var(--border-main)',
                              background: isExpanded ? 'rgba(37, 99, 235, 0.04)' : undefined,
                            }}
                          >
                            <td style={{ padding: '14px 18px' }}>
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
                                    {empGroup.employee?.designation || 'Staff'} · <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{empGroup.employee?.employeeId}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '14px 18px' }}>
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
                                          borderRadius: '4px',
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

                            <td style={{ padding: '14px 18px', textAlign: 'right', color: 'var(--text-main)', fontWeight: 500 }}>
                              ৳{empGroup.totalBasic.toLocaleString()}
                            </td>

                            <td style={{ padding: '14px 18px', textAlign: 'right', color: 'var(--text-main)', fontWeight: 500 }}>
                              ৳{empGroup.totalGross.toLocaleString()}
                            </td>

                            <td style={{ padding: '14px 18px', textAlign: 'right', color: '#ef4444', fontWeight: 500 }}>
                              -৳{empGroup.totalDeductions.toLocaleString()}
                            </td>

                            <td style={{ padding: '14px 18px', textAlign: 'right', color: 'var(--success)', fontWeight: 800, fontSize: '14px' }}>
                              ৳{empGroup.totalNet.toLocaleString()}
                            </td>

                            <td style={{ padding: '14px 18px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 500 }}>
                              ৳{avgNet.toLocaleString()}
                            </td>

                            <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                              {empGroup.allPaid ? (
                                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                  ALL PAID
                                </span>
                              ) : (
                                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                  HAS PENDING
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setExpandedEmpKey(isExpanded ? null : empKey)}
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

                          {/* Expanded row with monthly records */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} style={{ padding: '16px 24px', background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>history</span>
                                    <span>Monthly Payslips in {filterYear} for {empGroup.employee?.firstName} {empGroup.employee?.lastName}</span>
                                  </div>

                                  <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-card)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                      <thead>
                                        <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Month</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Basic</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Gross</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Net Salary</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Disbursal</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {empGroup.records.map(rec => {
                                          const meta = STATUS_META[rec.status] || { color: 'var(--text-muted)', bg: 'var(--surface-hover)' };
                                          return (
                                            <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                                              <td style={{ padding: '10px 14px', fontWeight: 600 }}>{MONTHS[rec.month - 1]} {rec.year}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>৳{Number(rec.basicSalary).toLocaleString()}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>৳{Number(rec.grossSalary).toLocaleString()}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>৳{Number(rec.netSalary).toLocaleString()}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, color: meta.color, background: meta.bg }}>
                                                  {rec.status}
                                                </span>
                                              </td>
                                              <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                                                {rec.paymentDate ? `${new Date(rec.paymentDate).toLocaleDateString()} (${rec.paymentMethod || 'Paid'})` : '—'}
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

      {/* Payment Confirmation Modal */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setPayModal(null); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', borderRadius: '20px', padding: '32px', margin: '16px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Confirm Payment</h2>
                <button onClick={() => setPayModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Marking salary as <strong>PAID</strong> for <strong>{payModal.name}</strong>
              </p>
              <div style={{ marginTop: '12px', padding: '14px', borderRadius: '12px', background: 'var(--success-subtle)', border: '1px solid var(--success)', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--success)' }}>৳{payModal.amount.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '2px' }}>Net Pay Amount</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={ls}>Payment Method</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={is}>
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={ls}>Transaction Reference</label>
                <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="e.g. TXN-20240701-001" style={is} />
              </div>
              <div>
                <label style={ls}>Note (optional)</label>
                <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Any additional note" style={is} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                <button className="btn btn-secondary" onClick={() => setPayModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmPayment} disabled={paying}
                  style={{ background: 'var(--success)', minWidth: '140px' }}>
                  {paying ? 'Processing…' : '✓ Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ls: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
const is: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
