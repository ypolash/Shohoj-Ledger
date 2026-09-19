"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import styles from '../projects.module.css';

interface Employee { id: string; firstName: string; lastName: string; }

interface RoleAssignment {
  id: string;
  role: 'Employee' | 'Freelancer' | 'Model' | 'Custom';
  customRoleName?: string;
  employeeType: 'permanent' | 'temporary';
  managerId: string;
  temporaryEmployeeName: string;
  freelancerName: string;
  modelName: string;
  notes: string;
  showAddChoice?: boolean;
}

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

  const createDefaultRole = (): RoleAssignment => ({
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    role: 'Employee',
    customRoleName: '',
    employeeType: 'permanent',
    managerId: '',
    temporaryEmployeeName: '',
    freelancerName: '',
    modelName: '',
    notes: '',
    showAddChoice: false,
  });

  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([createDefaultRole()]);

  const handleAddRole = () => {
    setRoleAssignments(prev => [...prev, createDefaultRole()]);
  };

  const handleRemoveRole = (id: string) => {
    setRoleAssignments(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(r => r.id !== id);
    });
  };

  const handleUpdateRole = (id: string, updates: Partial<RoleAssignment>) => {
    setRoleAssignments(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const [form, setForm] = useState({
    name: '', projectCode: '', clientName: '', clientPhone: '', priority: 'Medium',
    startDate: '', endDate: '', expectedShootingDate: '', expectedEditingDate: '', estimatedBudget: '', advancePayment: '', description: ''
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
      const assignmentLines: string[] = [];
      let validManagerId: string | undefined = undefined;
      const teamMemberIds: string[] = [];
      const projectTags: string[] = [];

      roleAssignments.forEach((ra, idx) => {
        const rolePrefix = roleAssignments.length > 1 ? `Role #${idx + 1}` : 'Role';
        if (ra.role === 'Employee') {
          if (!projectTags.includes('Role:Employee')) projectTags.push('Role:Employee');
          if (ra.employeeType === 'temporary') {
            if (!projectTags.includes('Temp-Employee')) projectTags.push('Temp-Employee');
            const tempName = ra.temporaryEmployeeName.trim() || 'Temporary Staff';
            assignmentLines.push(`• ${rolePrefix}: Employee (Temporary: ${tempName})${ra.notes.trim() ? ` - Notes: ${ra.notes.trim()}` : ''}`);
          } else {
            if (ra.managerId?.trim()) {
              const empId = ra.managerId.trim();
              if (!validManagerId) validManagerId = empId;
              if (!teamMemberIds.includes(empId)) teamMemberIds.push(empId);
              const emp = employees.find(e => e.id === empId);
              const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'Assigned Employee';
              assignmentLines.push(`• ${rolePrefix}: Employee (${empName})${ra.notes.trim() ? ` - Notes: ${ra.notes.trim()}` : ''}`);
            }
          }
        } else if (ra.role === 'Freelancer') {
          if (!projectTags.includes('Role:Freelancer')) projectTags.push('Role:Freelancer');
          const fName = ra.freelancerName.trim() || 'Specialist';
          assignmentLines.push(`• ${rolePrefix}: Freelancer (${fName})${ra.notes.trim() ? ` - Notes: ${ra.notes.trim()}` : ''}`);
        } else if (ra.role === 'Model') {
          if (!projectTags.includes('Role:Model')) projectTags.push('Role:Model');
          const mName = ra.modelName.trim() || 'Talent / Agency';
          assignmentLines.push(`• ${rolePrefix}: Model (${mName})${ra.notes.trim() ? ` - Notes: ${ra.notes.trim()}` : ''}`);
        } else if (ra.role === 'Custom') {
          const cRole = ra.customRoleName?.trim() || 'Custom Role';
          if (!projectTags.includes(`Role:${cRole}`)) projectTags.push(`Role:${cRole}`);
          assignmentLines.push(`• ${rolePrefix}: ${cRole}${ra.notes.trim() ? ` - Notes: ${ra.notes.trim()}` : ''}`);
        }
      });

      let finalDescription = form.description.trim();
      if (assignmentLines.length > 0) {
        const assignmentBlock = `[Resource & Team Assignment]\n${assignmentLines.join('\n')}`;
        finalDescription = finalDescription ? `${finalDescription}\n\n${assignmentBlock}` : assignmentBlock;
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          projectCode: form.projectCode.trim(),
          clientName: form.clientName.trim() || undefined,
          clientPhone: form.clientPhone.trim() || undefined,
          priority: form.priority,
          managerId: validManagerId,
          teamMemberIds: teamMemberIds.length > 0 ? teamMemberIds : undefined,
          tags: projectTags,
          startDate: form.startDate ? form.startDate : undefined,
          endDate: form.endDate ? form.endDate : undefined,
          expectedShootingDate: form.expectedShootingDate ? form.expectedShootingDate : undefined,
          expectedEditingDate: form.expectedEditingDate ? form.expectedEditingDate : undefined,
          estimatedBudget: form.estimatedBudget ? Number(form.estimatedBudget) : undefined,
          advancePayment: form.advancePayment ? Number(form.advancePayment) : undefined,
          description: finalDescription || undefined
        })
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to create project'); return; }
      setSuccess('Project created successfully!');
      setShowModal(false);
      setForm({ name: '', projectCode: '', clientName: '', clientPhone: '', priority: 'Medium', startDate: '', endDate: '', expectedShootingDate: '', expectedEditingDate: '', estimatedBudget: '', advancePayment: '', description: '' });
      setRoleAssignments([createDefaultRole()]);
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
    <PageContainer>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              href="/erp/projects"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                textDecoration: 'none'
              }}
              title="Back to Projects Overview"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
            </Link>
            <div>
              <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '24px', fontWeight: 700 }}>All Projects Directory</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Comprehensive directory and monitoring for all enterprise projects.
              </p>
            </div>
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
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        <div>{project.clientName || '—'}</div>
                        {project.clientPhone && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#60a5fa' }}>call</span>
                            <span>{project.clientPhone}</span>
                          </div>
                        )}
                      </td>
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
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className={styles.modalContent}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitleGroup}>
                <div className={styles.modalIconBadge}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                    account_tree
                  </span>
                </div>
                <div className={styles.modalTitleText}>
                  <h2 className={styles.modalMainTitle}>Create New Project</h2>
                  <p className={styles.modalSubTitle}>
                    Configure project parameters, assign leadership, and set delivery milestones.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={styles.closeBtn}
                title="Close (Esc)"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  close
                </span>
              </button>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#34d399', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Section: Project Identity */}
              <div className={styles.formSectionDivider}>
                <span className={styles.formSectionLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#c084fc' }}>badge</span>
                  Project Identity
                </span>
                <div className={styles.formSectionLine} />
              </div>

              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Project Name <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>folder</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Core Banking Migration"
                      value={form.name}
                      onChange={(e) => handleForm('name', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Project Code / Identifier</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>tag</span>
                    <input
                      type="text"
                      placeholder="e.g. PRJ-2026-001"
                      value={form.projectCode}
                      onChange={(e) => handleForm('projectCode', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Client / Stakeholder</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>domain</span>
                    <input
                      type="text"
                      placeholder="e.g. Enterprise Client Ltd"
                      value={form.clientName}
                      onChange={(e) => handleForm('clientName', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Client Phone Number</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>call</span>
                    <input
                      type="tel"
                      placeholder="e.g. +880 1712-345678"
                      value={form.clientPhone}
                      onChange={(e) => handleForm('clientPhone', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Roles & Team Assignment */}
              <div className={styles.formSectionDivider}>
                <span className={styles.formSectionLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#c084fc' }}>groups</span>
                  Role & Team Assignments
                </span>
                <div className={styles.formSectionLine} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {roleAssignments.map((ra, index) => (
                  <div key={ra.id} className={styles.roleAssignmentCard}>
                    <div className={styles.roleCardHeader}>
                      <span className={styles.roleCardNumber}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>badge</span>
                        Role Assignment #{index + 1}
                      </span>
                      {roleAssignments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(ra.id)}
                          className={styles.removeRoleBtn}
                          title="Remove this role assignment"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                        </button>
                      )}
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Role Type</label>
                        <div className={styles.selectWrapper}>
                          <span className={`material-symbols-outlined ${styles.inputIcon}`}>assignment_ind</span>
                          <select
                            value={ra.role}
                            onChange={(e) => {
                              const newRole = e.target.value as any;
                              handleUpdateRole(ra.id, {
                                role: newRole,
                                managerId: newRole === 'Employee' ? ra.managerId : '',
                                employeeType: 'permanent',
                                showAddChoice: false
                              });
                            }}
                            className={styles.fieldSelect}
                          >
                            <option value="Employee">Employee (Internal)</option>
                            <option value="Freelancer">Freelancer</option>
                            <option value="Model">Model / Talent</option>
                            <option value="Custom">Custom Role</option>
                          </select>
                          <span className={`material-symbols-outlined ${styles.selectChevron}`}>expand_more</span>
                        </div>
                      </div>

                      {/* Role-Specific Details */}
                      {ra.role === 'Custom' && (
                        <div className={styles.formField}>
                          <label className={styles.fieldLabel}>Custom Role Title</label>
                          <div className={styles.inputWrapper}>
                            <span className={`material-symbols-outlined ${styles.inputIcon}`}>label</span>
                            <input
                              type="text"
                              placeholder="e.g. Drone Operator, Sound Engineer"
                              value={ra.customRoleName || ''}
                              onChange={(e) => handleUpdateRole(ra.id, { customRoleName: e.target.value })}
                              className={styles.fieldInput}
                            />
                          </div>
                        </div>
                      )}

                      {ra.role === 'Employee' && (
                        <div className={styles.formField}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <label className={styles.fieldLabel}>
                              {ra.employeeType === 'temporary' ? 'Temporary Employee' : 'Assign Employee'}
                            </label>

                            {ra.employeeType === 'permanent' ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateRole(ra.id, { showAddChoice: !ra.showAddChoice })}
                                className={styles.addEmpToggleBtn}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                  person_add
                                </span>
                                + Add Employee
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateRole(ra.id, { employeeType: 'permanent', temporaryEmployeeName: '', showAddChoice: false });
                                }}
                                className={styles.switchEmpBtn}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                  arrow_back
                                </span>
                                Select from Directory
                              </button>
                            )}
                          </div>

                          {/* Add Employee Choice Box */}
                          {ra.showAddChoice && ra.employeeType === 'permanent' && (
                            <div className={styles.addEmpChoiceBox}>
                              <div className={styles.addEmpChoiceHeader}>
                                <span style={{ fontWeight: 600, fontSize: '12px', color: '#f8fafc' }}>
                                  Choose Employee Type to Add
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRole(ra.id, { showAddChoice: false })}
                                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                </button>
                              </div>

                              <div className={styles.choiceGrid}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateRole(ra.id, { employeeType: 'temporary', managerId: '', showAddChoice: false });
                                  }}
                                  className={styles.choiceCard}
                                >
                                  <div className={styles.choiceIconBox} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>timer</span>
                                  </div>
                                  <div className={styles.choiceTextBox}>
                                    <strong>Temporary Employee</strong>
                                    <p>Project-only staff. Not saved in global employee directory.</p>
                                  </div>
                                </button>

                                <a
                                  href="/erp/staff-management/employees/new"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.choiceCard}
                                  onClick={() => handleUpdateRole(ra.id, { showAddChoice: false })}
                                >
                                  <div className={styles.choiceIconBox} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>badge</span>
                                  </div>
                                  <div className={styles.choiceTextBox}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <strong>Permanent Employee</strong>
                                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#c084fc' }}>open_in_new</span>
                                    </div>
                                    <p>Go to permanent employee creation page in Staff Management.</p>
                                  </div>
                                </a>
                              </div>
                            </div>
                          )}

                          {/* If Permanent: Select Employee */}
                          {ra.employeeType === 'permanent' ? (
                            <div className={styles.selectWrapper}>
                              <span className={`material-symbols-outlined ${styles.inputIcon}`}>person</span>
                              <select
                                value={ra.managerId}
                                onChange={(e) => handleUpdateRole(ra.id, { managerId: e.target.value })}
                                className={styles.fieldSelect}
                              >
                                <option value="">Select Employee from roster...</option>
                                {employees.map((emp) => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName}
                                  </option>
                                ))}
                              </select>
                              <span className={`material-symbols-outlined ${styles.selectChevron}`}>expand_more</span>
                            </div>
                          ) : (
                            <div>
                              <div className={styles.inputWrapper}>
                                <span className={`material-symbols-outlined ${styles.inputIcon}`}>person_outline</span>
                                <input
                                  type="text"
                                  placeholder="Enter temporary employee name (e.g. Alex Contractor)"
                                  value={ra.temporaryEmployeeName}
                                  onChange={(e) => handleUpdateRole(ra.id, { temporaryEmployeeName: e.target.value })}
                                  className={styles.fieldInput}
                                />
                              </div>
                              <div className={styles.tempNotice}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#fbbf24' }}>info</span>
                                <span>Temporary employee is attached to this project only.</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {ra.role === 'Freelancer' && (
                        <div className={styles.formField}>
                          <label className={styles.fieldLabel}>Freelancer Specialist</label>
                          <div className={styles.inputWrapper}>
                            <span className={`material-symbols-outlined ${styles.inputIcon}`}>laptop_mac</span>
                            <input
                              type="text"
                              placeholder="Enter freelancer name or handle (e.g. Sarah Jenkins - UI Designer)"
                              value={ra.freelancerName}
                              onChange={(e) => handleUpdateRole(ra.id, { freelancerName: e.target.value })}
                              className={styles.fieldInput}
                            />
                          </div>
                        </div>
                      )}

                      {ra.role === 'Model' && (
                        <div className={styles.formField}>
                          <label className={styles.fieldLabel}>Model / Talent Agency</label>
                          <div className={styles.inputWrapper}>
                            <span className={`material-symbols-outlined ${styles.inputIcon}`}>photo_camera</span>
                            <input
                              type="text"
                              placeholder="Enter model name or agency talent (e.g. Elena Rostova - Elite Model)"
                              value={ra.modelName}
                              onChange={(e) => handleUpdateRole(ra.id, { modelName: e.target.value })}
                              className={styles.fieldInput}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>
                        Role Notes & Responsibilities
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400, marginLeft: '4px' }}>
                          (Optional notes, deliverable requirements, or instructions)
                        </span>
                      </label>
                      <div className={styles.inputWrapper}>
                        <span className={`material-symbols-outlined ${styles.inputIcon}`}>edit_note</span>
                        <input
                          type="text"
                          placeholder="e.g. Lead UI sprints, milestone reviews, or video shooting operator"
                          value={ra.notes}
                          onChange={(e) => handleUpdateRole(ra.id, { notes: e.target.value })}
                          className={styles.fieldInput}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* + Add Another Role Button */}
                <button
                  type="button"
                  onClick={handleAddRole}
                  className={styles.addRoleBtn}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    group_add
                  </span>
                  + Add Another Role
                </button>
              </div>

              {/* Section: Budget & Advance Pay */}
              <div className={styles.formSectionDivider}>
                <span className={styles.formSectionLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#60a5fa' }}>payments</span>
                  Budget & Advance Pay
                </span>
                <div className={styles.formSectionLine} />
              </div>

              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Estimated Budget</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.currencyPrefix}>BDT</span>
                    <input
                      type="number"
                      placeholder="e.g. 750,000"
                      value={form.estimatedBudget}
                      onChange={(e) => handleForm('estimatedBudget', e.target.value)}
                      className={`${styles.fieldInput} ${styles.currencyFieldInput}`}
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Advance Pay</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.currencyPrefix}>BDT</span>
                    <input
                      type="number"
                      placeholder="e.g. 50,000 (0 if none)"
                      value={form.advancePayment}
                      onChange={(e) => handleForm('advancePayment', e.target.value)}
                      className={`${styles.fieldInput} ${styles.currencyFieldInput}`}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Timeline */}
              <div className={styles.formSectionDivider}>
                <span className={styles.formSectionLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#34d399' }}>calendar_month</span>
                  Timeline & Schedule
                </span>
                <div className={styles.formSectionLine} />
              </div>

              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Project Start Date</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>calendar_today</span>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => handleForm('startDate', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Target Delivery Date</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>event_available</span>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => handleForm('endDate', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Expected Shooting Date</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>photo_camera</span>
                    <input
                      type="date"
                      value={form.expectedShootingDate}
                      onChange={(e) => handleForm('expectedShootingDate', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Expected Editing Date</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>movie_edit</span>
                    <input
                      type="date"
                      value={form.expectedEditingDate}
                      onChange={(e) => handleForm('expectedEditingDate', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Scope & Description */}
              <div className={styles.formSectionDivider}>
                <span className={styles.formSectionLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#fbbf24' }}>description</span>
                  Scope & Objectives
                </span>
                <div className={styles.formSectionLine} />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Scope Summary & Milestone Deliverables</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe the deliverables, team expectations, and project requirements..."
                  value={form.description}
                  onChange={(e) => handleForm('description', e.target.value)}
                  className={styles.fieldTextarea}
                />
              </div>

              {/* Modal Footer */}
              <div className={styles.modalFooter}>
                <span className={styles.keyboardHint}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#64748b' }}>
                    info
                  </span>
                  Project Code & ID will be generated upon creation
                </span>

                <div className={styles.footerButtons}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={styles.submitBtn}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {submitting ? 'hourglass_empty' : 'rocket_launch'}
                    </span>
                    {submitting ? 'Provisioning...' : 'Create Project'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </PageContainer>
  );
}

const ls: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
const is: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
