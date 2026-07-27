"use client";

import React, { useState, useEffect } from 'react';

interface Department {
  id: string; name: string; code?: string; description?: string; isActive: boolean;
  head?: { firstName: string; lastName: string };
  _count: { employees: number };
}

/**
 * ERP HR — Departments Page
 * Lists all departments with employee counts and head info.
 * Supports creating departments via modal connected to /api/departments.
 */
export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { fetchDepts(); }, []);

  const fetchDepts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/departments');
      if (res.ok) setDepartments(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleForm = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/departments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to create department'); return; }
      setSuccessMsg('Department created!'); setShowModal(false);
      setForm({ name: '', code: '', description: '', isActive: true });
      fetchDepts(); setTimeout(() => setSuccessMsg(''), 3000);
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Departments</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>{departments.length} department{departments.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => { setShowModal(true); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>Add Department
        </button>
      </div>

      {successMsg && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>✓ {successMsg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--spacing-4)' }}>
        {isLoading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel" style={{ borderRadius: '16px', padding: '24px', height: '120px', opacity: 0.6 }} />
        )) : departments.length === 0 ? (
          <div className="glass-panel" style={{ borderRadius: '16px', padding: '60px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1/-1' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>corporate_fare</span>
            No departments yet.
          </div>
        ) : departments.map(dept => (
          <div key={dept.id} className="glass-panel hover-lift" style={{ borderRadius: '16px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>corporate_fare</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>{dept.name}</div>
                  {dept.code && <div style={{ fontSize: '12px', color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 600 }}>{dept.code}</div>}
                </div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: dept.isActive ? 'var(--success)' : 'var(--text-muted)', background: dept.isActive ? 'var(--success-subtle)' : 'var(--surface-hover)' }}>
                {dept.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-main)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {dept.head && (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>person</span>
                  HOD: {dept.head.firstName} {dept.head.lastName}
                </div>
              )}
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>group</span>
                {dept._count.employees} employee{dept._count.employees !== 1 ? 's' : ''}
              </div>
              {dept.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dept.description}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', borderRadius: '20px', padding: '32px', margin: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Add Department</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>
            {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '14px' }}>⚠ {error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field2 label="Department Name *" value={form.name} onChange={v => handleForm('name', v)} placeholder="e.g. Engineering" required />
              <Field2 label="Code" value={form.code} onChange={v => handleForm('code', v)} placeholder="e.g. ENG" />
              <div>
                <label style={ls}>Description</label>
                <textarea value={form.description} onChange={e => handleForm('description', e.target.value)} placeholder="Optional" rows={2} style={{ ...is, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field2({ label, value, onChange, placeholder, required, type = 'text' }: any) {
  return (
    <div>
      <label style={ls}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} style={is} />
    </div>
  );
}
const ls: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
const is: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
