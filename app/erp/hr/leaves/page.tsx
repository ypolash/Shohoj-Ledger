"use client";

import React, { useState, useEffect } from 'react';

interface LeaveRequest {
  id: string; type: string; startDate: string; endDate: string;
  reason: string; status: string; createdAt: string;
  employeeId: string;
  employee?: { firstName: string; lastName: string; designation: string };
}

interface Employee { id: string; firstName: string; lastName: string; employeeId: string; }

const LEAVE_TYPES = ['CASUAL', 'SICK', 'UNPAID', 'ANNUAL', 'MATERNITY', 'PATERNITY'];

const statusColors: Record<string, { color: string; bg: string }> = {
  PENDING:  { color: 'var(--warning)', bg: 'var(--warning-subtle)' },
  APPROVED: { color: 'var(--success)', bg: 'var(--success-subtle)' },
  REJECTED: { color: 'var(--danger)',  bg: 'var(--danger-subtle)' },
  CANCELLED:{ color: 'var(--text-muted)', bg: 'var(--surface-hover)' },
};

/**
 * ERP HR — Leaves Page
 * Displays leave requests with status filtering, Approve/Reject actions,
 * and Submit Leave modal connected to /api/leaves.
 */
export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employeeId: '', type: 'CASUAL', startDate: '', endDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [lRes, eRes] = await Promise.all([fetch('/api/leaves'), fetch('/api/employees')]);
      if (lRes.ok) setLeaves(await lRes.json());
      if (eRes.ok) setEmployees(await eRes.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed'); return; }
      setSuccessMsg('Leave submitted!'); setShowModal(false);
      setForm({ employeeId: '', type: 'CASUAL', startDate: '', endDate: '', reason: '' });
      loadAll(); setTimeout(() => setSuccessMsg(''), 3000);
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  /** Approves or rejects a leave request */
  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(id);
    try {
      await fetch('/api/leaves', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      loadAll();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const filtered = statusFilter ? leaves.filter(l => l.status === statusFilter) : leaves;

  const statusCounts = {
    PENDING:  leaves.filter(l => l.status === 'PENDING').length,
    APPROVED: leaves.filter(l => l.status === 'APPROVED').length,
    REJECTED: leaves.filter(l => l.status === 'REJECTED').length,
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Leave Requests</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>{leaves.length} total · {statusCounts.PENDING} pending</p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => { setShowModal(true); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>Submit Leave
        </button>
      </div>

      {successMsg && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>✓ {successMsg}</div>}

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[{ label: 'All', value: '' }, { label: `Pending (${statusCounts.PENDING})`, value: 'PENDING' }, { label: `Approved (${statusCounts.APPROVED})`, value: 'APPROVED' }, { label: `Rejected (${statusCounts.REJECTED})`, value: 'REJECTED' }]
          .map(opt => (
            <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
              style={{ padding: '8px 16px', borderRadius: '20px', border: `2px solid ${statusFilter === opt.value ? 'var(--primary)' : 'var(--border-main)'}`, background: statusFilter === opt.value ? 'var(--primary-subtle)' : 'transparent', color: statusFilter === opt.value ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}>
              {opt.label}
            </button>
          ))}
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
              {['Employee', 'Type', 'Dates', 'Reason', 'Applied', 'Status', 'Actions'].map(h => (
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
            )) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>event_busy</span>
                No leave requests found.
              </td></tr>
            ) : filtered.map(l => {
              const sc = statusColors[l.status] || { color: 'var(--text-muted)', bg: 'var(--surface-hover)' };
              const isPending = l.status === 'PENDING';
              return (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border-main)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : l.employeeId}
                    {l.employee?.designation && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.employee.designation}</div>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-subtle)' }}>{l.type}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(l.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: sc.color, background: sc.bg }}>{l.status}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {isPending ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleAction(l.id, 'APPROVED')} disabled={actionLoading === l.id}
                          style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', background: 'var(--success-subtle)', color: 'var(--success)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          ✓ Approve
                        </button>
                        <button onClick={() => handleAction(l.id, 'REJECTED')} disabled={actionLoading === l.id}
                          style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          ✗ Reject
                        </button>
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', borderRadius: '20px', padding: '32px', margin: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Submit Leave Request</h2>
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
              <div>
                <label style={ls}>Leave Type *</label>
                <select value={form.type} onChange={e => handleForm('type', e.target.value)} style={is}>
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={ls}>Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => handleForm('startDate', e.target.value)} required style={is} />
                </div>
                <div>
                  <label style={ls}>End Date *</label>
                  <input type="date" value={form.endDate} onChange={e => handleForm('endDate', e.target.value)} required style={is} />
                </div>
              </div>
              <div>
                <label style={ls}>Reason *</label>
                <textarea value={form.reason} onChange={e => handleForm('reason', e.target.value)} placeholder="Reason for leave..." required rows={3} style={{ ...is, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Leave'}</button>
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
