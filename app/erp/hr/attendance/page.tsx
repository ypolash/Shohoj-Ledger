"use client";

import React, { useState, useEffect } from 'react';

interface AttendanceRecord {
  id: string; date: string; status: string; isLate: boolean;
  lateMinutes: number; checkInTime?: string; checkOutTime?: string;
  employeeId: string;
}

interface Employee { id: string; firstName: string; lastName: string; employeeId: string; }

const STATUS_OPTIONS = ['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'WEEKLY_OFF', 'OFF_DAY_WORK'];

const statusColors: Record<string, { color: string; bg: string }> = {
  PRESENT:     { color: 'var(--success)', bg: 'var(--success-subtle)' },
  LATE:        { color: 'var(--warning)', bg: 'var(--warning-subtle)' },
  ABSENT:      { color: 'var(--danger)',  bg: 'var(--danger-subtle)' },
  HALF_DAY:    { color: 'var(--warning)', bg: 'var(--warning-subtle)' },
  WEEKLY_OFF:  { color: 'var(--text-muted)', bg: 'var(--surface-hover)' },
  OFF_DAY_WORK:{ color: 'var(--accent)',  bg: 'var(--primary-subtle)' },
};

/**
 * ERP HR — Attendance Page
 * Shows attendance records filterable by employee and supports recording new attendance
 * via a modal connected to /api/attendance.
 */
export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterEmpId, setFilterEmpId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employeeId: '', date: new Date().toISOString().slice(0, 10),
    status: 'PRESENT', checkIn: '', checkOut: '', lateMinutes: '0',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { loadEmployees(); }, []);
  useEffect(() => { loadAttendance(); }, [filterEmpId]);

  const loadEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) setEmployees(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadAttendance = async () => {
    setIsLoading(true);
    try {
      const url = filterEmpId ? `/api/attendance?employeeId=${filterEmpId}` : '/api/attendance';
      const res = await fetch(url);
      if (res.ok) setRecords(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: form.employeeId,
          date: form.date,
          status: form.status,
          checkIn: form.checkIn || undefined,
          checkOut: form.checkOut || undefined,
          lateMinutes: Number(form.lateMinutes) || 0,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to record attendance'); return; }
      setSuccessMsg('Attendance recorded!'); setShowModal(false);
      setForm({ employeeId: '', date: new Date().toISOString().slice(0, 10), status: 'PRESENT', checkIn: '', checkOut: '', lateMinutes: '0' });
      loadAttendance(); setTimeout(() => setSuccessMsg(''), 3000);
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  const empMap = Object.fromEntries(employees.map(e => [e.id, e]));
  const displayRecords = records.slice(0, 100);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Attendance</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>{records.length} records {filterEmpId ? '(filtered)' : ''}</p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => { setShowModal(true); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>Record Attendance
        </button>
      </div>

      {successMsg && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>✓ {successMsg}</div>}

      {/* Filter */}
      <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '14px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Filter by Employee:</label>
          <select value={filterEmpId} onChange={e => setFilterEmpId(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', minWidth: '200px' }}>
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>)}
          </select>
          {filterEmpId && (
            <button className="btn btn-secondary" onClick={() => setFilterEmpId('')} style={{ fontSize: '13px', padding: '7px 14px' }}>Clear</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                {['Employee', 'Date', 'Status', 'Check In', 'Check Out', 'Late (min)'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}><div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.7 }} /></td>
                  ))}
                </tr>
              )) : displayRecords.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>fact_check</span>
                  No attendance records found.
                </td></tr>
              ) : displayRecords.map(r => {
                const emp = empMap[r.employeeId];
                const sc = statusColors[r.status] || { color: 'var(--text-muted)', bg: 'var(--surface-hover)' };
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-main)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-main)' }}>
                      {emp ? `${emp.firstName} ${emp.lastName}` : r.employeeId}
                      {emp && <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{emp.employeeId}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{new Date(r.date).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: sc.color, background: sc.bg }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: r.lateMinutes > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: r.lateMinutes > 0 ? 600 : 400 }}>{r.lateMinutes}</td>
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
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Record Attendance</h2>
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
                  <label style={ls}>Date *</label>
                  <input type="date" value={form.date} onChange={e => handleForm('date', e.target.value)} required style={is} />
                </div>
                <div>
                  <label style={ls}>Status</label>
                  <select value={form.status} onChange={e => handleForm('status', e.target.value)} style={is}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={ls}>Check In Time</label>
                  <input type="datetime-local" value={form.checkIn} onChange={e => handleForm('checkIn', e.target.value)} style={is} />
                </div>
                <div>
                  <label style={ls}>Check Out Time</label>
                  <input type="datetime-local" value={form.checkOut} onChange={e => handleForm('checkOut', e.target.value)} style={is} />
                </div>
                <div>
                  <label style={ls}>Late Minutes</label>
                  <input type="number" value={form.lateMinutes} onChange={e => handleForm('lateMinutes', e.target.value)} min="0" style={is} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Record'}</button>
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
