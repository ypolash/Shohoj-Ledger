"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation: string;
  department?: string;
  basicSalary: number;
  status: string;
  joinDate: string;
  departmentRef?: { name: string };
  designationRef?: { name: string };
}

interface Department { id: string; name: string; }
interface Designation { id: string; name: string; }

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '', password: '',
  designation: '', department: '', basicSalary: '',
  joinDate: new Date().toISOString().slice(0, 10),
  departmentId: '', designationId: '', status: 'ACTIVE',
};

/**
 * ERP HR — Employees Page
 * Searchable employee directory with Add Employee modal connected to /api/employees.
 * Loads departments and designations for dropdown references.
 */
export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [empRes, deptRes, desigRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/departments'),
        fetch('/api/designations'),
      ]);
      if (empRes.ok)   setEmployees(await empRes.json());
      if (deptRes.ok)  setDepartments(await deptRes.json());
      if (desigRes.ok) setDesignations(await desigRes.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          basicSalary: Number(form.basicSalary),
          departmentId: form.departmentId || undefined,
          designationId: form.designationId || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to add employee'); return; }
      setSuccessMsg('Employee added successfully!');
      setShowModal(false);
      setForm(EMPTY_FORM);
      loadAll();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.email} ${e.employeeId}`.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, { color: string; bg: string }> = {
    ACTIVE:     { color: 'var(--success)', bg: 'var(--success-subtle)' },
    ON_LEAVE:   { color: 'var(--warning)', bg: 'var(--warning-subtle)' },
    TERMINATED: { color: 'var(--danger)',  bg: 'var(--danger-subtle)' },
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Employees</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            {employees.length} employee{employees.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/erp/hr/employees/new" className="btn btn-primary hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
          Add Employee
        </Link>
      </div>

      {successMsg && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>✓ {successMsg}</div>}

      {/* Search */}
      <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '14px' }}>
        <div style={{ position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'var(--text-muted)' }}>search</span>
          <input type="text" placeholder="Search by name, email, ID..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
              {['Employee', 'Department', 'Designation', 'Basic Salary', 'Join Date', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} style={{ padding: '14px 16px' }}><div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.7 }} /></td>
                ))}
              </tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>badge</span>
                {search ? 'No employees match your search.' : 'No employees yet. Add your first one.'}
              </td></tr>
            ) : filtered.map(emp => {
              const s = statusColor[emp.status] || { color: 'var(--text-muted)', bg: 'var(--surface-hover)' };
              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-main)', cursor: 'pointer' }}
                  onClick={() => router.push(`/erp/hr/employees/${encodeURIComponent(`${emp.firstName}_${emp.lastName}`.trim().replace(/\s+/g, '_'))}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>{emp.firstName[0]}{emp.lastName[0]}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp.firstName} {emp.lastName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--primary)', fontFamily: 'monospace' }}>{emp.employeeId}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{emp.departmentRef?.name || emp.department || '—'}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{emp.designationRef?.name || emp.designation || '—'}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>৳{Number(emp.basicSalary).toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{new Date(emp.joinDate).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: s.color, background: s.bg }}>{emp.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required, type = 'text' }: any) {
  return (
    <div>
      <label style={ls}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} style={is} />
    </div>
  );
}

const ls: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
const is: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
