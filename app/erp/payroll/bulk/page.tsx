"use client";

import React, { useState, useEffect } from 'react';

interface Department { id: string; name: string; _count: { employees: number }; }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/**
 * ERP Payroll — Bulk Generate Page
 * Generates payroll for all employees or filtered by department in one API call.
 * Calls POST /api/payroll/bulk.
 * Supports: all active employees, a specific department, or future employee multi-select.
 */
export default function BulkPayrollPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    scope: 'all', departmentId: '',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    workingDays: '26',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ generated: number; skipped: number } | null>(null);

  useEffect(() => { loadDepartments(); }, []);

  const loadDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      if (res.ok) setDepartments(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(''); setResult(null);
    try {
      const payload: Record<string, any> = {
        month: Number(form.month),
        year: Number(form.year),
        workingDays: Number(form.workingDays),
      };
      if (form.scope === 'department' && form.departmentId) {
        payload.departmentId = form.departmentId;
      }
      // scope === 'all' → no filter → API generates for all active employees

      const res = await fetch('/api/payroll/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Bulk generation failed'); return; }
      setResult(d);
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  const scopeLabel = form.scope === 'all' ? 'All Active Employees'
    : departments.find(d => d.id === form.departmentId)?.name || 'Selected Department';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)', maxWidth: '700px' }}>
      <div>
        <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Bulk Payroll Generation</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
          Generate payroll for all or a group of employees at once. Records already generated for the selected period are automatically skipped.
        </p>
      </div>

      {error && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid var(--danger)', fontSize: '14px' }}>⚠ {error}</div>}

      {result && (
        <div style={{ padding: '20px', borderRadius: '14px', background: 'var(--success-subtle)', border: '1px solid var(--success)' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--success)', marginBottom: '8px' }}>✓ Bulk Generation Complete</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)' }}>{result.generated}</span>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '6px' }}>generated</span>
            </div>
            <div>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-muted)' }}>{result.skipped}</span>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '6px' }}>skipped (already exist)</span>
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            View generated records in the <a href="/erp/payroll" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Payroll Overview →</a>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '16px', color: 'var(--text-main)' }}>Generation Settings</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Scope selector */}
          <div>
            <label style={ls}>Target Employees</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[{ v: 'all', label: 'All Active Employees', icon: 'group' }, { v: 'department', label: 'By Department', icon: 'corporate_fare' }].map(opt => (
                <button key={opt.v} type="button" onClick={() => handleForm('scope', opt.v)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: '12px', border: `2px solid ${form.scope === opt.v ? 'var(--primary)' : 'var(--border-main)'}`, background: form.scope === opt.v ? 'var(--primary-subtle)' : 'var(--surface-hover)', cursor: 'pointer', textAlign: 'left', color: form.scope === opt.v ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '14px', transition: 'all 0.15s' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Department picker */}
          {form.scope === 'department' && (
            <div>
              <label style={ls}>Select Department *</label>
              <select value={form.departmentId} onChange={e => handleForm('departmentId', e.target.value)} required style={is}>
                <option value="">— Choose a department —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d._count.employees} employees)</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={ls}>Month *</label>
              <select value={form.month} onChange={e => handleForm('month', e.target.value)} required style={is}>
                {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={ls}>Year *</label>
              <select value={form.year} onChange={e => handleForm('year', e.target.value)} required style={is}>
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={ls}>Working Days *</label>
              <input type="number" value={form.workingDays} onChange={e => handleForm('workingDays', e.target.value)} min="1" max="31" required style={is} />
            </div>
          </div>

          {/* Summary preview */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>group</span>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target</div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '14px' }}>{scopeLabel}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>calendar_month</span>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Period</div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '14px' }}>{MONTHS[Number(form.month) - 1]} {form.year}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>work_history</span>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Working Days</div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '14px' }}>{form.workingDays} days</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--warning-subtle)', border: '1px solid var(--warning)', fontSize: '13px', color: 'var(--warning)', display: 'flex', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>info</span>
            All records are created in <strong>DRAFT</strong> status. You can review and approve them from the Payroll Overview page. Employees already processed for this period are automatically skipped.
          </div>

          <button type="submit" className="btn btn-primary hover-lift" disabled={submitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', fontSize: '15px', fontWeight: 700 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>bolt</span>
            {submitting ? 'Generating…' : 'Run Bulk Payroll'}
          </button>
        </form>
      </div>
    </div>
  );
}

const ls: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
const is: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
