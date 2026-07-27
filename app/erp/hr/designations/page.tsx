"use client";

import React, { useState, useEffect } from 'react';

interface Designation {
  id: string; name: string; grade?: string; level?: string; description?: string; isActive: boolean;
  _count: { employees: number };
}

/**
 * ERP HR — Designations Page
 * Lists all designations with employee counts.
 * Supports creating new designations via modal connected to /api/designations.
 */
export default function DesignationsPage() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', grade: '', level: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { fetchDesignations(); }, []);

  const fetchDesignations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/designations');
      if (res.ok) setDesignations(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/designations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to create'); return; }
      setSuccessMsg('Designation created!'); setShowModal(false);
      setForm({ name: '', grade: '', level: '', description: '' });
      fetchDesignations(); setTimeout(() => setSuccessMsg(''), 3000);
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Designations</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>{designations.length} designation{designations.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => { setShowModal(true); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>Add Designation
        </button>
      </div>

      {successMsg && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>✓ {successMsg}</div>}

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
              {['Designation', 'Grade', 'Level', 'Employees', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} style={{ padding: '14px 16px' }}><div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.7 }} /></td>
                ))}
              </tr>
            )) : designations.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>work</span>
                No designations yet. Add one to get started.
              </td></tr>
            ) : designations.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid var(--border-main)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>work</span>
                    {d.name}
                  </div>
                  {d.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', marginLeft: '28px' }}>{d.description}</div>}
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{d.grade || '—'}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{d.level || '—'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'var(--surface-hover)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600 }}>{d._count.employees}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: d.isActive ? 'var(--success)' : 'var(--text-muted)', background: d.isActive ? 'var(--success-subtle)' : 'var(--surface-hover)' }}>
                    {d.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', borderRadius: '20px', padding: '32px', margin: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Add Designation</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>
            {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '14px' }}>⚠ {error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={ls}>Designation Name *</label>
                <input type="text" value={form.name} onChange={e => handleForm('name', e.target.value)} placeholder="e.g. Senior Engineer" required style={is} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={ls}>Grade</label>
                  <input type="text" value={form.grade} onChange={e => handleForm('grade', e.target.value)} placeholder="e.g. G4" style={is} />
                </div>
                <div>
                  <label style={ls}>Level</label>
                  <input type="text" value={form.level} onChange={e => handleForm('level', e.target.value)} placeholder="e.g. Mid-Senior" style={is} />
                </div>
              </div>
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

const ls: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
const is: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
