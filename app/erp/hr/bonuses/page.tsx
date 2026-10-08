"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface BonusRecord {
  id: string;
  month: number;
  year: number;
  type: string;
  amount: number;
  reason?: string;
  createdAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    departmentRef?: { name: string };
    designationRef?: { name: string };
  };
}

export default function BonusesPage() {
  const [bonuses, setBonuses] = useState<BonusRecord[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    type: 'PERFORMANCE',
    amount: '5000',
    reason: 'Quarterly target achievement bonus',
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
      const res = await fetch(`/api/hr/bonuses?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setBonuses(data.bonuses || []);
        setEmployees(data.employees || []);
        setStats(data.stats || {});
      }
    } catch (e) {
      console.error('Failed to load bonuses:', e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/hr/bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to grant bonus');
        return;
      }
      showToast('Bonus granted & linked to upcoming payroll calculation!');
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
    return bonuses.filter(b => {
      const q = search.toLowerCase();
      const emp = `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.toLowerCase();
      const empId = (b.employee?.employeeId || '').toLowerCase();
      return !q || emp.includes(q) || empId.includes(q);
    });
  }, [bonuses, search]);

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
            Bonuses & Special Incentives
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Award performance bonuses, festival allowances, and incentives that automatically roll into monthly payroll.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => { setShowModal(true); setError(''); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Award Bonus
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Bonuses (Period)', value: formatBDT(stats.totalBonus), icon: 'redeem', color: '#10b981' },
          { label: 'Beneficiary Count', value: stats.count ?? 0, icon: 'diversity_3', color: '#3b82f6' },
          { label: 'Target Period', value: `${MONTHS[Number(selectedMonth) - 1]} ${selectedYear}`, icon: 'calendar_month', color: '#8b5cf6' },
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

          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={selectStyle}
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={String(i + 1)}>{m}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              style={selectStyle}
            >
              {['2024', '2025', '2026', '2027'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
              {['Employee', 'Period', 'Type', 'Amount', 'Reason / Description', 'Date'].map(h => (
                <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  No bonuses recorded for this period.
                </td>
              </tr>
            ) : (
              filtered.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {b.employee?.firstName} {b.employee?.lastName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {b.employee?.designationRef?.name || 'Staff'} · <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{b.employee?.employeeId}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                    {MONTHS[b.month - 1]} {b.year}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                      {b.type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--success)', fontSize: '14px' }}>
                    +{formatBDT(Number(b.amount))}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                    {b.reason || 'Bonus incentive'}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    {new Date(b.createdAt).toLocaleDateString()}
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
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Award Employee Bonus</h2>
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
                  <label style={labelStyle}>Bonus Amount (BDT) *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Bonus Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="PERFORMANCE">Performance Bonus</option>
                    <option value="FESTIVAL">Festival Allowance</option>
                    <option value="TARGET">Sales / Target Incentive</option>
                    <option value="RETENTION">Retention Bonus</option>
                    <option value="SPECIAL">Special Recognition</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Month</label>
                  <select
                    value={form.month}
                    onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                    style={inputStyle}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i + 1} value={String(i + 1)}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Year</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Reason / Justification</label>
                <input
                  type="text"
                  placeholder="e.g. Completed Project X ahead of schedule"
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Award Bonus
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

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '10px',
  border: '1px solid var(--border-main)',
  background: 'var(--surface-input)',
  color: 'var(--text-main)',
  fontSize: '13px',
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
