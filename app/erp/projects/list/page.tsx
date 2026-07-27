"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Employee { id: string; firstName: string; lastName: string; }

export default function ProjectListPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '', projectCode: '', clientName: '', priority: 'Medium', managerId: '',
    startDate: '', endDate: '', estimatedBudget: '', description: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, [search, statusFilter]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects?search=${search}&status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`/api/employees`);
      if (res.ok) setEmployees(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, estimatedBudget: Number(form.estimatedBudget) || 0 })
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to create project'); return; }
      setSuccess('Project created successfully!');
      setShowModal(false);
      setForm({ name: '', projectCode: '', clientName: '', priority: 'Medium', managerId: '', startDate: '', endDate: '', estimatedBudget: '', description: '' });
      fetchProjects();
      setTimeout(() => setSuccess(''), 4000);
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  const getStatusMeta = (status: string) => {
    switch(status) {
      case 'Active': return { color: 'var(--primary)', bg: 'var(--primary-subtle)' };
      case 'Completed': return { color: 'var(--success)', bg: 'var(--success-subtle)' };
      case 'Delayed': return { color: 'var(--danger)', bg: 'var(--danger-subtle)' };
      case 'On Hold': return { color: 'var(--warning)', bg: 'var(--warning-subtle)' };
      case 'Planning': return { color: 'var(--accent)', bg: 'var(--primary-subtle)' };
      case 'Draft': return { color: 'var(--text-muted)', bg: 'var(--surface-hover)' };
      case 'Cancelled': return { color: 'var(--danger)', bg: 'var(--danger-subtle)' };
      default: return { color: 'var(--text-main)', bg: 'var(--surface-hover)' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>All Projects</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Manage and monitor your enterprise projects.
          </p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => { setShowModal(true); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          New Project
        </button>
      </div>

      {success && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>✓ {success}</div>}

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'var(--text-muted)' }}>search</span>
          <input type="text" placeholder="Search by code, name, client..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', minWidth: '150px' }}>
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Planning">Planning</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Code</th>
                <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Project Name</th>
                <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Client</th>
                <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Progress</th>
                <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Status</th>
                <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Manager</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                    {Array.from({ length: 6 }).map((_, j) => <td key={j} style={{ padding: '14px 16px' }}><div style={{ height: '14px', background: 'var(--surface-hover)', borderRadius: '6px', opacity: 0.7 }} /></td>)}
                  </tr>
                ))
              ) : projects.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>folder_off</span>
                  No projects found.
                </td></tr>
              ) : (
                projects.map(project => {
                  const meta = getStatusMeta(project.status);
                  return (
                    <tr 
                      key={project.id} 
                      style={{ borderBottom: '1px solid var(--border-main)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => router.push(`/erp/projects/${project.id}`)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>{project.projectCode}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>{project.name}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{project.clientName || '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '80px', height: '6px', backgroundColor: 'var(--surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${project.progress || 0}%`, height: '100%', backgroundColor: meta.color }}></div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{project.progress || 0}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ 
                          background: meta.bg, color: meta.color,
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 
                        }}>
                          {project.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : 'Unassigned'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Project Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', borderRadius: '20px', padding: '32px', margin: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Create New Project</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>
            
            {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '14px' }}>⚠ {error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={ls}>Project Code *</label>
                  <input type="text" value={form.projectCode} onChange={e => handleForm('projectCode', e.target.value)} required placeholder="e.g. PRJ-2024-01" style={is} />
                </div>
                <div>
                  <label style={ls}>Project Name *</label>
                  <input type="text" value={form.name} onChange={e => handleForm('name', e.target.value)} required placeholder="e.g. Website Redesign" style={is} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={ls}>Client Name</label>
                  <input type="text" value={form.clientName} onChange={e => handleForm('clientName', e.target.value)} placeholder="e.g. Acme Corp" style={is} />
                </div>
                <div>
                  <label style={ls}>Priority</label>
                  <select value={form.priority} onChange={e => handleForm('priority', e.target.value)} style={is}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={ls}>Project Manager</label>
                <select value={form.managerId} onChange={e => handleForm('managerId', e.target.value)} style={is}>
                  <option value="">— Select Manager —</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={ls}>Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => handleForm('startDate', e.target.value)} style={is} />
                </div>
                <div>
                  <label style={ls}>End Date</label>
                  <input type="date" value={form.endDate} onChange={e => handleForm('endDate', e.target.value)} style={is} />
                </div>
                <div>
                  <label style={ls}>Est. Budget</label>
                  <input type="number" value={form.estimatedBudget} onChange={e => handleForm('estimatedBudget', e.target.value)} placeholder="0" style={is} />
                </div>
              </div>

              <div>
                <label style={ls}>Description</label>
                <textarea value={form.description} onChange={e => handleForm('description', e.target.value)} placeholder="Project description and goals..." rows={3} style={{ ...is, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Project'}</button>
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
