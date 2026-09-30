"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './projects.module.css';

interface ProjectItem {
  id: string;
  name: string;
  projectCode?: string;
  clientName?: string;
  clientPhone?: string;
  status: string;
  priority?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  expectedShootingDate?: string;
  expectedEditingDate?: string;
  estimatedBudget?: number;
  actualCost?: number;
  manager?: { firstName: string; lastName: string };
}

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

export default function ProjectDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

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
    name: '',
    projectCode: '',
    clientName: '',
    clientPhone: '',
    priority: 'Medium',
    startDate: '',
    endDate: '',
    expectedShootingDate: '',
    expectedEditingDate: '',
    estimatedBudget: '',
    description: ''
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dashRes, projectsRes, empRes] = await Promise.all([
        fetch('/api/projects/dashboard'),
        fetch('/api/projects'),
        fetch('/api/employees')
      ]);

      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (projectsRes.ok) {
        const pData = await projectsRes.json();
        setProjectsList(pData.projects || []);
      }
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (e) {
      console.error("Failed to load projects data:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const onFocus = async () => {
      try {
        const empRes = await fetch('/api/employees');
        if (empRes.ok) setEmployees(await empRes.json());
      } catch {}
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(Number(val || 0));
  };

  const handleFormChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError("");
    setCreateSuccess("");

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
              const emp = employees.find(emp => emp.id === empId);
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

      const payload = {
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
        description: finalDescription || undefined
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create project");
        return;
      }

      setCreateSuccess("Project created successfully!");
      setShowModal(false);
      setForm({
        name: '',
        projectCode: '',
        clientName: '',
        clientPhone: '',
        priority: 'Medium',
        startDate: '',
        endDate: '',
        expectedShootingDate: '',
        expectedEditingDate: '',
        estimatedBudget: '',
        description: ''
      });
      setRoleAssignments([createDefaultRole()]);
      fetchData();
      setTimeout(() => setCreateSuccess(""), 4000);
    } catch {
      setCreateError("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const metrics = dashboardData?.metrics || {};

  const filteredProjects = projectsList.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch =
      (p.name || '').toLowerCase().includes(q) ||
      (p.projectCode || '').toLowerCase().includes(q) ||
      (p.clientName || '').toLowerCase().includes(q) ||
      (p.clientPhone || '').toLowerCase().includes(q);

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && (p.status || '').toLowerCase() === statusFilter.toLowerCase();
  });

  // Calculate metrics
  const totalProjects = projectsList.length;
  const activeProjects = projectsList.filter(p => (p.status || '').toLowerCase() === 'active').length;
  const completedProjects = projectsList.filter(p => (p.status || '').toLowerCase() === 'completed').length;
  const totalBudget = projectsList.reduce((acc, p) => acc + Number(p.estimatedBudget || 0), 0);
  const avgProgress = totalProjects > 0
    ? Math.round(projectsList.reduce((acc, p) => acc + (p.progress || 0), 0) / totalProjects)
    : 0;

  return (
    <div className={styles.projectsWrapper}>
      {/* 1. Minimalist Executive Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            Projects &amp; Milestones Command
            <span className={styles.titleBadge}>
              {projectsList.length} {projectsList.length === 1 ? 'Project' : 'Projects'}
            </span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          {/* Refresh / Sync Button */}
          <button
            onClick={() => fetchData()}
            disabled={isLoading}
            title="Refresh Portfolio Data"
            aria-label="Refresh Portfolio Data"
            className={styles.headerIconBtn}
          >
            <span className={`material-symbols-outlined ${isLoading ? styles.spinning : ''}`} style={{ fontSize: '20px' }}>
              refresh
            </span>
          </button>

          {/* + New Project Button */}
          <button
            onClick={() => setShowModal(true)}
            className={`${styles.headerIconBtn} ${styles.headerIconBtnPrimary}`}
            title="Create New Project"
            aria-label="Create New Project"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              add
            </span>
          </button>
        </div>
      </header>

      {/* 2. Executive 4-KPI Metrics Row */}
      <section className={styles.kpiGrid} id="milestones">
        {/* Total Projects */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
              <span className="material-symbols-outlined">folder</span>
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
              Portfolio
            </span>
          </div>
          <div className={styles.kpiValueGroup}>
            <span className={styles.kpiLabel}>Total Projects</span>
            <div className={styles.kpiMainValue} style={{ color: '#a855f7' }}>{isLoading ? '...' : totalProjects}</div>
          </div>
          <div className={styles.kpiFooter}>
            <span>All Enterprise Workspaces</span>
            <span>{completedProjects} Completed</span>
          </div>
        </div>

        {/* Active Projects */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <span className="material-symbols-outlined">play_circle</span>
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              In Progress
            </span>
          </div>
          <div className={styles.kpiValueGroup}>
            <span className={styles.kpiLabel}>Active Projects</span>
            <div className={styles.kpiMainValue} style={{ color: '#10b981' }}>{isLoading ? '...' : activeProjects}</div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Live Execution</span>
            <span>Sprint Active</span>
          </div>
        </div>

        {/* Total Portfolio Budget */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              Estimated
            </span>
          </div>
          <div className={styles.kpiValueGroup}>
            <span className={styles.kpiLabel}>Portfolio Value</span>
            <div className={styles.kpiMainValue} style={{ color: '#3b82f6' }}>{isLoading ? '...' : formatCurrency(totalBudget)}</div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Budget Allocation</span>
            <span>Ledger Synced</span>
          </div>
        </div>

        {/* Average Progress */}
        <div className={styles.kpiCard} id="deadlines">
          <div className={styles.kpiTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
              <span className="material-symbols-outlined">monitoring</span>
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
              Milestones
            </span>
          </div>
          <div className={styles.kpiValueGroup}>
            <span className={styles.kpiLabel}>Average Delivery</span>
            <div className={styles.kpiMainValue} style={{ color: '#06b6d4' }}>{isLoading ? '...' : `${avgProgress}%`}</div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Delivery Tracking</span>
            <span>On Schedule</span>
          </div>
        </div>
      </section>

      {/* 3. Interactive Projects Directory Card */}
      <section className={styles.directoryCard}>
        <div className={styles.directoryControls}>
          <div className={styles.searchBox}>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '18px' }}>
              search
            </span>
            <input
              type="text"
              placeholder="Search projects by name, code, or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterTabs}>
            {[
              { id: 'ALL', label: 'All Projects' },
              { id: 'Active', label: 'Active' },
              { id: 'Planning', label: 'Planning' },
              { id: 'Completed', label: 'Completed' },
            ].map(f => (
              <button
                key={f.id}
                className={`${styles.filterTab} ${statusFilter.toLowerCase() === f.id.toLowerCase() ? styles.filterTabActive : ''}`}
                onClick={() => setStatusFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Project Details</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Client</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Lead / Manager</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Progress</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Budget</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Target Delivery</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Workspace</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading project records...
                  </td>
                </tr>
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((p) => {
                  const progress = p.progress || 0;
                  const isCompleted = (p.status || '').toLowerCase() === 'completed';
                  const isDelayed = p.endDate && new Date(p.endDate).getTime() < new Date().getTime() && !isCompleted;

                  return (
                    <tr
                      key={p.id}
                      className={styles.tableRow}
                    >
                      {/* Name & Code */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className={styles.projectNameText}>
                            {p.name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                background: 'rgba(37, 99, 235, 0.12)',
                                color: '#2563eb',
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              {p.projectCode || 'NO-CODE'}
                            </span>
                            {p.priority && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                • {p.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Client */}
                      <td style={{ padding: '14px 16px' }} className={styles.projectCellText}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.clientName || 'Internal Company'}</div>
                        {p.clientPhone && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#2563eb' }}>call</span>
                            <span>{p.clientPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Manager */}
                      <td style={{ padding: '14px 16px' }} className={styles.projectCellText}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              background: 'rgba(37, 99, 235, 0.12)',
                              color: '#2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700
                            }}
                          >
                            {(p.manager?.firstName || 'M').charAt(0)}
                          </div>
                          <span>
                            {p.manager ? `${p.manager.firstName} ${p.manager.lastName}` : 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      {/* Progress & Status */}
                      <td style={{ padding: '14px 16px', minWidth: '130px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span style={{ fontWeight: 600, color: isCompleted ? '#10b981' : 'var(--text-main)' }}>
                              {p.status}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>{progress}%</span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'var(--surface-hover)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: isCompleted ? '#10b981' : '#2563eb',
                                borderRadius: '9999px',
                                transition: 'width 0.4s ease'
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Budget */}
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {formatCurrency(p.estimatedBudget || 0)}
                      </td>

                      {/* Target Delivery */}
                      <td style={{ padding: '14px 16px' }}>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 500, color: isDelayed ? '#ef4444' : 'var(--text-main)' }}>
                            {p.endDate ? new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Deadline'}
                          </span>
                          {isDelayed && (
                            <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 600 }}>Overdue</div>
                          )}
                          {!isDelayed && p.endDate && (
                            <div style={{ fontSize: '10px', color: '#10b981' }}>On Schedule</div>
                          )}
                        </div>
                      </td>

                      {/* Workspace Link */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <Link
                          href={`/erp/projects/${p.id}`}
                          className={styles.workspaceLink}
                        >
                          Workspace →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No projects found. Click &ldquo;+&rdquo; to launch your first project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Create Project Modal */}
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

            {createError && (
              <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: '12px', color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                <span>{createError}</span>
              </div>
            )}

            {createSuccess && (
              <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: '12px', color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                <span>{createSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Section: Project Identity */}
              <div className={styles.formSectionDivider}>
                <span className={styles.formSectionLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>badge</span>
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
                      placeholder="e.g. Core Enterprise Migration"
                      value={form.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
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
                      onChange={(e) => handleFormChange('projectCode', e.target.value)}
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
                      onChange={(e) => handleFormChange('clientName', e.target.value)}
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
                      onChange={(e) => handleFormChange('clientPhone', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Roles & Team Assignment */}
              <div className={styles.formSectionDivider}>
                <span className={styles.formSectionLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>groups</span>
                  Role &amp; Team Assignments
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
                                <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-main)' }}>
                                  Choose Employee Type to Add
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRole(ra.id, { showAddChoice: false })}
                                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
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
                                  <div className={styles.choiceIconBox} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>timer</span>
                                  </div>
                                  <div className={styles.choiceTextBox}>
                                    <strong>Temporary Employee</strong>
                                    <p>Project-only staff. Not saved in global employee directory.</p>
                                  </div>
                                </button>

                                <a
                                  href="/erp/hr/employees/new"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.choiceCard}
                                  onClick={() => handleUpdateRole(ra.id, { showAddChoice: false })}
                                >
                                  <div className={styles.choiceIconBox} style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>badge</span>
                                  </div>
                                  <div className={styles.choiceTextBox}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <strong>Permanent Employee</strong>
                                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#2563eb' }}>open_in_new</span>
                                    </div>
                                    <p>Go to permanent employee creation page in HR module.</p>
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
                                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#d97706' }}>info</span>
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
                        Role Notes &amp; Responsibilities
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>
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

              {/* Section: Budget */}
              <div className={styles.formSectionDivider}>
                <span className={styles.formSectionLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>payments</span>
                  Estimated Budget
                </span>
                <div className={styles.formSectionLine} />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Estimated Budget</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.currencyPrefix}>BDT</span>
                  <input
                    type="number"
                    placeholder="e.g. 750,000"
                    value={form.estimatedBudget}
                    onChange={(e) => handleFormChange('estimatedBudget', e.target.value)}
                    className={`${styles.fieldInput} ${styles.currencyFieldInput}`}
                  />
                </div>
              </div>

              {/* Section: Timeline */}
              <div className={styles.formSectionDivider}>
                <span className={styles.formSectionLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#10b981' }}>calendar_month</span>
                  Timeline &amp; Schedule
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
                      onChange={(e) => handleFormChange('startDate', e.target.value)}
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
                      onChange={(e) => handleFormChange('endDate', e.target.value)}
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
                      onChange={(e) => handleFormChange('expectedShootingDate', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Expected Editing Date</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>movie</span>
                    <input
                      type="date"
                      value={form.expectedEditingDate}
                      onChange={(e) => handleFormChange('expectedEditingDate', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={styles.modalFooter}>
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
                  {submitting ? 'Creating Project...' : 'Launch Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
