"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface SalaryAdvance {
  id: string;
  amount: number;
  remainingAmount: number;
  monthlyDeduction?: number;
  reason?: string;
  status: string;
  requestedDate: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    departmentRef?: { name: string };
    designationRef?: { name: string };
  };
}

export default function AdvancesPage() {
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    amount: '10000',
    monthlyDeduction: '5000',
    reason: 'Personal / Family requirement',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hr/advances');
      if (res.ok) {
        const data = await res.json();
        setAdvances(data.advances || []);
        setEmployees(data.employees || []);
        setStats(data.stats || {});
      }
    } catch (e) {
      console.error('Failed to load advances:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/hr/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to issue advance');
        return;
      }
      showToast('Salary advance approved & scheduled for monthly payroll deduction!');
      setShowModal(false);
      loadData();
    } catch {
      setError('Network connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatBDT = (v: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(v || 0);

  const filtered = useMemo(() => {
    return advances.filter(a => {
      const q = search.toLowerCase();
      const emp = `${a.employee?.firstName || ''} ${a.employee?.lastName || ''}`.toLowerCase();
      const empId = (a.employee?.employeeId || '').toLowerCase();
      const matchesSearch = !q || emp.includes(q) || empId.includes(q);
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [advances, search, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          padding: '12px 20px', borderRadius: '10px', background: '#10b981', color: '#fff',
          fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
        }}>
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
            Salary Advances & Installment Recovery
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Issue salary advances with automated monthly installment deductions during payroll processing.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => { setShowModal(true); setError(''); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Issue Salary Advance
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Advances Issued', value: formatBDT(stats.totalAdvanced), icon: 'request_quote', color: '#3b82f6' },
          { label: 'Outstanding Balance', value: formatBDT(stats.totalRemaining), icon: 'pending', color: '#ef4444' },
          { label: 'Active Advance Accounts', value: stats.activeCount ?? 0, icon: 'account_balance', color: '#f59e0b' },
          { label: 'Total Records', value: advances.length, icon: 'receipt_long', color: '#10b981' },
        ].map((kpi, i) => (
          <div key={i} className="glass-card" style={{ padding: '16px 20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{kpi.label}</span>
              <span className="material-symbols-outlined" style={{ color: kpi.color, fontSize: '20px' }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '14px 20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
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

        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'APPROVED', 'REPAID'].map(st => (
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

      {/* Table */}
      <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
              {['Employee', 'Total Issued', 'Monthly Deduction', 'Remaining Balance', 'Reason / Purpose', 'Status', 'Date'].map(h => (
                <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  No salary advances found.
                </td>
              </tr>
            ) : (
              filtered.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {a.employee?.firstName} {a.employee?.lastName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {a.employee?.designationRef?.name || 'Staff'} · <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{a.employee?.employeeId}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {formatBDT(Number(a.amount))}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                    {formatBDT(Number(a.monthlyDeduction || a.amount))} / mo
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: Number(a.remainingAmount) > 0 ? '#ef4444' : '#10b981' }}>
                    {formatBDT(Number(a.remainingAmount))}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                    {a.reason || 'General advance'}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700,
                      background: a.status === 'REPAID' || Number(a.remainingAmount) === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: a.status === 'REPAID' || Number(a.remainingAmount) === 0 ? '#10b981' : '#f59e0b'
                    }}>
                      {Number(a.remainingAmount) === 0 ? 'REPAID' : a.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    {new Date(a.requestedDate).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', borderRadius: '20px', padding: '28px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Issue Salary Advance</h2>
            {error && <div style={errorBannerStyle}>⚠ {error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Employee *</label>
                <select
                  value={form.employeeId}
                  onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  required
                  style={inputStyle}
                >
                  <option value="">— Select Employee —</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Advance Amount (BDT) *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Monthly Installment Deduction *</label>
                  <input
                    type="number"
                    value={form.monthlyDeduction}
                    onChange={e => setForm(f => ({ ...f, monthlyDeduction: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Medical emergency, festival advance"
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Confirm & Issue Advance
                </button>
              </div>
            </form>
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
