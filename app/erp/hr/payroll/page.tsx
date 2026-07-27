"use client";

import React, { useState, useEffect } from 'react';

interface PayrollRecord {
  id: string; month: number; year: number; basicSalary: number;
  grossSalary: number; netSalary: number; status: string; createdAt: string;
  employee: { firstName: string; lastName: string; designation: string; employeeId: string };
}

interface Employee { id: string; firstName: string; lastName: string; employeeId: string; }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const statusColors: Record<string, { color: string; bg: string }> = {
  DRAFT:       { color: 'var(--text-muted)',   bg: 'var(--surface-hover)' },
  CALCULATED:  { color: 'var(--accent)',       bg: 'var(--primary-subtle)' },
  SUBMITTED:   { color: 'var(--warning)',      bg: 'var(--warning-subtle)' },
  APPROVED:    { color: 'var(--primary)',      bg: 'var(--primary-subtle)' },
  PAID:        { color: 'var(--success)',      bg: 'var(--success-subtle)' },
  CANCELLED:   { color: 'var(--danger)',       bg: 'var(--danger-subtle)' },
};

/**
 * ERP HR — Payroll Page
 * Displays payroll records with summary KPIs and supports generating
 * new payroll via modal connected to /api/payroll (POST).
 */
export default function PayrollPage() {
  const [payments, setPayments] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employeeId: '', month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()), workingDays: '26', status: 'DRAFT',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [payRes, empRes] = await Promise.all([
        fetch('/api/payroll'),
        fetch('/api/employees'),
      ]);
      if (payRes.ok) { const d = await payRes.json(); setPayments(d.payments || []); setSummary(d.summary || {}); }
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: form.employeeId,
          month: Number(form.month),
          year: Number(form.year),
          workingDays: Number(form.workingDays),
          status: form.status,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to generate payroll'); return; }
      setSuccessMsg('Payroll generated successfully!'); setShowModal(false);
      loadAll(); setTimeout(() => setSuccessMsg(''), 4000);
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(v || 0);

  const summaryKpis = [
    { label: 'Total Basic Salary', value: formatCurrency(summary.totalSalary), color: 'var(--text-main)' },
    { label: 'Total Bonus', value: formatCurrency(summary.totalBonus), color: 'var(--success)' },
    { label: 'Total Deductions', value: formatCurrency(summary.totalDeductions), color: 'var(--danger)' },
    { label: 'Net Payable', value: formatCurrency(summary.totalNetPay), color: 'var(--primary)' },
    { label: 'Pending Payslips', value: summary.pendingCount ?? '—', color: 'var(--warning)' },
    { label: 'Paid Payslips', value: summary.processedCount ?? '—', color: 'var(--success)' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Payroll</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            {payments.length} payroll record{payments.length !== 1 ? 's' : ''} · {summary.currentMonth || ''}
          </p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => { setShowModal(true); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>payments</span>
          Generate Payroll
        </button>
      </div>

      {successMsg && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>✓ {successMsg}</div>}

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 'var(--spacing-4)' }}>
        {summaryKpis.map(kpi => (
          <div key={kpi.label} className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '8px' }}>{kpi.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: kpi.color }}>
              {isLoading ? <span style={{ opacity: 0.4 }}>···</span> : kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Payroll Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                {['Employee', 'Period', 'Basic', 'Gross', 'Net Pay', 'Status', 'Generated'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}><div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.7 }} /></td>
                  ))}
                </tr>
              )) : payments.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>payments</span>
                  No payroll records. Generate one to get started.
                </td></tr>
              ) : payments.map(p => {
                const sc = statusColors[p.status] || { color: 'var(--text-muted)', bg: 'var(--surface-hover)' };
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-main)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {p.employee?.firstName} {p.employee?.lastName}
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.employee?.designation}</div>
                      <div style={{ fontSize: '12px', color: 'var(--primary)', fontFamily: 'monospace' }}>{p.employee?.employeeId}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {MONTHS[p.month - 1]} {p.year}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)' }}>৳{Number(p.basicSalary).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)' }}>৳{Number(p.grossSalary).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--success)' }}>৳{Number(p.netSalary).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: sc.color, background: sc.bg }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', borderRadius: '20px', padding: '32px', margin: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Generate Payroll</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Select employee and period to calculate payroll.</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>
            {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '14px' }}>⚠ {error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={ls}>Employee *</label>
                <select value={form.employeeId} onChange={e => handleForm('employeeId', e.target.value)} required style={is}>
                  <option value="">— Select Employee —</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={ls}>Month *</label>
                  <select value={form.month} onChange={e => handleForm('month', e.target.value)} required style={is}>
                    {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={ls}>Year *</label>
                  <input type="number" value={form.year} onChange={e => handleForm('year', e.target.value)} min="2020" max="2035" required style={is} />
                </div>
                <div>
                  <label style={ls}>Working Days *</label>
                  <input type="number" value={form.workingDays} onChange={e => handleForm('workingDays', e.target.value)} min="1" max="31" required style={is} />
                </div>
                <div>
                  <label style={ls}>Status</label>
                  <select value={form.status} onChange={e => handleForm('status', e.target.value)} style={is}>
                    <option value="DRAFT">Draft</option>
                    <option value="CALCULATED">Calculated</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ minWidth: '160px' }}>
                  {submitting ? 'Generating…' : 'Generate Payroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
const ls: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
const is: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
