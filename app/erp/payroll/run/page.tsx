"use client";

import React, { useState, useEffect } from 'react';

interface Employee { id: string; firstName: string; lastName: string; employeeId: string; basicSalary: number; designation: string; }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/**
 * ERP Payroll — Run (Individual) Payroll Page
 * Generates payroll for a single employee for a specific month/year.
 * Fetches employee list to show salary preview before submitting.
 * Calls POST /api/payroll.
 */
export default function RunPayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({
    employeeId: '', month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()), workingDays: '26', status: 'DRAFT',
  });
  const [preview, setPreview] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) setEmployees(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleForm = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'employeeId') {
      const emp = employees.find(e => e.id === v);
      setPreview(emp || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(''); setSuccess('');
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
      setSuccess(`✓ Payroll generated for ${preview?.firstName} ${preview?.lastName} — ${MONTHS[Number(form.month) - 1]} ${form.year}`);
      setForm(f => ({ ...f, employeeId: '' })); setPreview(null);
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i);
  const estSalary = preview ? Number(preview.basicSalary) : 0;
  const estDaily = estSalary / Number(form.workingDays || 1);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)', maxWidth: '700px' }}>
      <div>
        <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Generate Individual Payroll</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
          Calculate and record payroll for a single employee. The system will automatically compute attendance deductions, bonuses, and leaves.
        </p>
      </div>

      {error && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid var(--danger)', fontSize: '14px' }}>⚠ {error}</div>}
      {success && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-5)' }}>
        {/* Form */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '16px', color: 'var(--text-main)' }}>Payroll Parameters</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                <select value={form.year} onChange={e => handleForm('year', e.target.value)} required style={is}>
                  {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={ls}>Working Days in Month *</label>
              <input type="number" value={form.workingDays} onChange={e => handleForm('workingDays', e.target.value)} min="1" max="31" required style={is} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Deductions are calculated per working day based on attendance.</span>
            </div>
            <div>
              <label style={ls}>Initial Status</label>
              <select value={form.status} onChange={e => handleForm('status', e.target.value)} style={is}>
                <option value="DRAFT">Draft — save for review</option>
                <option value="CALCULATED">Calculated — ready for approval</option>
                <option value="APPROVED">Approved — skip review</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting || !form.employeeId} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>calculate</span>
              {submitting ? 'Generating…' : 'Generate Payroll'}
            </button>
          </form>
        </div>

        {/* Preview panel */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '16px', color: 'var(--text-main)' }}>Salary Preview</h2>
          {!preview ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.3, display: 'block', marginBottom: '8px' }}>person_search</span>
              Select an employee to preview their salary breakdown.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '12px', background: 'var(--surface-hover)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>
                  {preview.firstName[0]}{preview.lastName[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>{preview.firstName} {preview.lastName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--primary)', fontFamily: 'monospace' }}>{preview.employeeId}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{preview.designation}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Basic Monthly Salary', value: `৳${estSalary.toLocaleString()}`, icon: 'account_balance', color: 'var(--primary)' },
                  { label: `Daily Rate (÷ ${form.workingDays} days)`, value: `৳${estDaily.toFixed(0)}`, icon: 'today', color: 'var(--text-secondary)' },
                  { label: 'Period', value: `${MONTHS[Number(form.month) - 1]} ${form.year}`, icon: 'calendar_month', color: 'var(--text-secondary)' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: item.color }}>{item.icon}</span>
                      {item.label}
                    </div>
                    <span style={{ fontWeight: 700, color: item.color, fontSize: '15px' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--primary-subtle)', border: '1px solid var(--primary)', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--primary)', marginBottom: '4px' }}>Final net pay will be calculated after deductions & bonuses</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>≈ ৳{estSalary.toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ls: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
const is: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
