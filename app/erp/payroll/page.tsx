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
  const [isLoading, setIsLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear]   = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    if (selectedIds.size === filtered.length && filtered.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(p => p.id)));
  };

  const filtered = filterStatus ? payments.filter(p => p.status === filterStatus) : payments;

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(v || 0);

  const kpis = [
    { label: 'Total Records',   value: payments.length,                    icon: 'receipt_long',    color: 'var(--text-main)' },
    { label: 'Total Net Pay',   value: fmt(summary.totalNetPay),           icon: 'payments',        color: 'var(--success)' },
    { label: 'Total Basic',     value: fmt(summary.totalSalary),           icon: 'account_balance',  color: 'var(--primary)' },
    { label: 'Total Bonus',     value: fmt(summary.totalBonus),            icon: 'star',            color: 'var(--accent)' },
    { label: 'Total Deductions',value: fmt(summary.totalDeductions),       icon: 'remove_circle',   color: 'var(--danger)' },
    { label: 'Pending',         value: summary.pendingCount ?? 0,          icon: 'pending_actions', color: 'var(--warning)' },
    { label: 'Paid',            value: summary.processedCount ?? 0,        icon: 'check_circle',    color: 'var(--success)' },
  ];

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Payroll Overview</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            {MONTHS[filterMonth - 1]} {filterYear} · {payments.length} records
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Month/Year picker */}
          <div className="glass-panel" style={{ display: 'flex', gap: '8px', padding: '8px 12px', borderRadius: '12px', alignItems: 'center' }}>
            <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px' }}>
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px' }}>
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
        {kpis.map(kpi => (
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
          const meta = s ? STATUS_META[s] : null;
          const isActive = filterStatus === s;
          return (
            <button key={s || 'all'} onClick={() => setFilterStatus(s)}
              style={{ padding: '7px 14px', borderRadius: '20px', border: `2px solid ${isActive ? 'var(--primary)' : 'var(--border-main)'}`, background: isActive ? 'var(--primary-subtle)' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}>
              {s || 'All'}
            </button>
          );
        })}

        {selectedIds.size > 0 && (
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

      {/* Main Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                <th style={{ padding: '12px 16px', width: '40px' }}>
                  <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleAll}
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
              )) : filtered.length === 0 ? (
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
              ) : filtered.map(p => {
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
                      {meta.next ? (
                        <button
                          onClick={() => handleStatusTransition(p.id, meta.next!, `${p.employee?.firstName} ${p.employee?.lastName}`, Number(p.netSalary))}
                          disabled={isActing}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', border: 'none', background: meta.next === 'PAID' ? 'var(--success)' : meta.next === 'LOCKED' ? 'var(--warning-subtle)' : 'var(--primary)', color: meta.next === 'LOCKED' ? 'var(--warning)' : 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: isActing ? 0.6 : 1 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{meta.nextIcon}</span>
                          {isActing ? '…' : meta.nextLabel}
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
