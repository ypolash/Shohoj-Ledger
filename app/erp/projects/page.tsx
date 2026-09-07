"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import styles from './projects.module.css';

interface ProjectItem {
  id: string;
  name: string;
  projectCode?: string;
  clientName?: string;
  status: string;
  priority?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  estimatedBudget?: number;
  actualCost?: number;
  manager?: { firstName: string; lastName: string };
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

  const [form, setForm] = useState({
    name: '',
    projectCode: '',
    clientName: '',
    priority: 'Medium',
    managerId: '',
    startDate: '',
    endDate: '',
    estimatedBudget: '',
    actualCost: '',
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

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', {
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
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          projectCode: form.projectCode.trim(),
          clientName: form.clientName.trim() || undefined,
          priority: form.priority,
          managerId: form.managerId?.trim() ? form.managerId.trim() : undefined,
          startDate: form.startDate ? form.startDate : undefined,
          endDate: form.endDate ? form.endDate : undefined,
          estimatedBudget: form.estimatedBudget ? Number(form.estimatedBudget) : undefined,
          actualCost: form.actualCost ? Number(form.actualCost) : undefined,
          description: form.description.trim() || undefined
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to create project.');

      setCreateSuccess("Project created successfully!");
      setForm({
        name: '',
        projectCode: '',
        clientName: '',
        priority: 'Medium',
        managerId: '',
        startDate: '',
        endDate: '',
        estimatedBudget: '',
        actualCost: '',
        description: ''
      });
      await fetchData();
      setTimeout(() => {
        setShowModal(false);
        setCreateSuccess("");
      }, 1500);
    } catch (err: any) {
      setCreateError(err.message || 'Error submitting project.');
    } finally {
      setSubmitting(false);
    }
  };

  const metrics = dashboardData?.metrics || {};
  const deadlines = dashboardData?.upcomingDeadlines || [];
  const activity = dashboardData?.recentActivity || [];

  const filteredProjects = projectsList.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch =
      (p.name || '').toLowerCase().includes(q) ||
      (p.projectCode || '').toLowerCase().includes(q) ||
      (p.clientName || '').toLowerCase().includes(q);

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && (p.status || '').toLowerCase() === statusFilter.toLowerCase();
  });

  const budgetUsage = Number(metrics.budgetUsage) || 0;
  const avgProgress = Number(metrics.averageProgress) || 0;

  return (
    <PageContainer>
      <div className={styles.projectsWrapper}>
        {/* Hero Header Banner (Without Topbar) */}
        <div className={styles.heroHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerMetaRow}>
              <div className={styles.pulseDot} />
              <span className={styles.headerCategory}>Enterprise Project Portfolio</span>
            </div>
            <h1 className={styles.headerTitle}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#c084fc' }}>
                account_tree
              </span>
              Projects & Milestones Command
            </h1>
            <p className={styles.headerSub}>
              Real-time portfolio management, team allocation, budget burn-rate, and milestone deliverables.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={() => setShowModal(true)}
              className={styles.createBtn}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                add_circle
              </span>
              + New Project
            </button>

            <button
              onClick={() => fetchData()}
              disabled={isLoading}
              title="Refresh Portfolio Data"
              className={styles.syncBtn}
            >
              <span className={`material-symbols-outlined ${isLoading ? 'spinning' : ''}`} style={{ fontSize: '18px' }}>
                refresh
              </span>
              Sync
            </button>
          </div>
        </div>

        {/* Executive KPI Metric Cards */}
        <div className={styles.kpiGrid}>
          {/* 1. Active Projects */}
          <div className={`${styles.kpiCard} ${styles.kpiGlowPurple}`}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIconBox} style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <span className="material-symbols-outlined" style={{ color: '#c084fc', fontSize: '24px' }}>
                  folder_open
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                Live Execution
              </span>
            </div>
            <div className={styles.kpiValueGroup}>
              <span className={styles.kpiLabel}>Active Projects</span>
              <div className={styles.kpiMainValue}>
                {isLoading ? '···' : metrics.activeProjects || 0}
              </div>
            </div>
            <div className={styles.kpiFooter}>
              <span>Completed: {metrics.completedProjects || 0}</span>
              <span>Total: {projectsList.length}</span>
            </div>
          </div>

          {/* 2. Portfolio Budget & Spend */}
          <div className={`${styles.kpiCard} ${styles.kpiGlowBlue}`}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIconBox} style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <span className="material-symbols-outlined" style={{ color: '#60a5fa', fontSize: '24px' }}>
                  payments
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: budgetUsage > 100 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: budgetUsage > 100 ? '#f87171' : '#60a5fa' }}>
                {budgetUsage}% Burn Rate
              </span>
            </div>
            <div className={styles.kpiValueGroup}>
              <span className={styles.kpiLabel}>Budget vs Actual Spend</span>
              <div className={styles.kpiMainValue}>
                {isLoading ? '···' : formatCurrency(metrics.totalCost || 0)}
              </div>
            </div>
            <div className={styles.miniProgressBar}>
              <div
                className={styles.miniProgressFill}
                style={{
                  width: `${Math.min(budgetUsage, 100)}%`,
                  background: budgetUsage > 90 ? '#ef4444' : '#3b82f6'
                }}
              />
            </div>
            <div className={styles.kpiFooter}>
              <span>Allocated: {formatCurrency(metrics.totalBudget || 0)}</span>
              <span>Actual Usage</span>
            </div>
          </div>

          {/* 3. Average Progress */}
          <div className={`${styles.kpiCard} ${styles.kpiGlowGreen}`}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <span className="material-symbols-outlined" style={{ color: '#34d399', fontSize: '24px' }}>
                  donut_large
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                Progress
              </span>
            </div>
            <div className={styles.kpiValueGroup}>
              <span className={styles.kpiLabel}>Average Completion Rate</span>
              <div className={styles.kpiMainValue}>
                {isLoading ? '···' : `${avgProgress}%`}
              </div>
            </div>
            <div className={styles.miniProgressBar}>
              <div
                className={styles.miniProgressFill}
                style={{
                  width: `${Math.min(avgProgress, 100)}%`,
                  background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                }}
              />
            </div>
            <div className={styles.kpiFooter}>
              <span>All Active Milestones</span>
              <span>On Schedule</span>
            </div>
          </div>

          {/* 4. Milestone & Deadlines Health */}
          <div className={`${styles.kpiCard} ${styles.kpiGlowAmber}`}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIconBox} style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '24px' }}>
                  alarm
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: metrics.delayedProjects > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: metrics.delayedProjects > 0 ? '#f87171' : '#34d399' }}>
                {metrics.delayedProjects > 0 ? `${metrics.delayedProjects} Delayed` : 'Healthy'}
              </span>
            </div>
            <div className={styles.kpiValueGroup}>
              <span className={styles.kpiLabel}>Upcoming Deadlines</span>
              <div className={styles.kpiMainValue}>
                {isLoading ? '···' : deadlines.length}
              </div>
            </div>
            <div className={styles.kpiFooter}>
              <span>Next 7 Days Deliveries</span>
              <span>Tracked Dates</span>
            </div>
          </div>
        </div>

        {/* Interactive Projects Directory Table */}
        <div className={styles.directoryCard}>
          <div className={styles.directoryControls}>
            <div className={styles.searchBox}>
              <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: '18px' }}>
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
                  className={`${styles.filterTab} ${statusFilter === f.id ? styles.filterTabActive : ''}`}
                  onClick={() => setStatusFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
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
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                      Loading project records...
                    </td>
                  </tr>
                ) : filteredProjects.length > 0 ? (
                  filteredProjects.map((p) => {
                    const progress = p.progress || 0;
                    const isCompleted = p.status === 'Completed';
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
                                  fontWeight: 600,
                                  background: 'rgba(124, 58, 237, 0.12)',
                                  color: '#a855f7',
                                  padding: '1px 6px',
                                  borderRadius: '4px'
                                }}
                              >
                                {p.projectCode || 'NO-CODE'}
                              </span>
                              {p.priority && (
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                  • {p.priority}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Client */}
                        <td style={{ padding: '14px 16px' }} className={styles.projectCellText}>
                          {p.clientName || 'Internal Company'}
                        </td>

                        {/* Manager */}
                        <td style={{ padding: '14px 16px' }} className={styles.projectCellText}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                background: 'rgba(168, 85, 247, 0.2)',
                                color: '#a855f7',
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
                              <span style={{ fontWeight: 600, color: isCompleted ? '#10b981' : undefined }} className={isCompleted ? undefined : styles.projectNameText}>
                                {p.status}
                              </span>
                              <span style={{ color: '#94a3b8' }}>{progress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '5px', background: 'rgba(100, 116, 139, 0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${progress}%`,
                                  height: '100%',
                                  background: isCompleted ? '#10b981' : isDelayed ? '#ef4444' : '#a855f7',
                                  borderRadius: '3px'
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Budget */}
                        <td style={{ padding: '14px 16px', fontWeight: 600 }} className={styles.projectNameText}>
                          {formatCurrency(p.estimatedBudget || 0)}
                        </td>

                        {/* Due Date */}
                        <td style={{ padding: '14px 16px' }}>
                          {p.endDate ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ color: isDelayed ? '#f87171' : undefined }} className={isDelayed ? undefined : styles.projectCellText}>
                                {new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span style={{ fontSize: '10px', color: isDelayed ? '#f87171' : '#64748b' }}>
                                {isDelayed ? 'Overdue' : 'On Schedule'}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#64748b' }}>No deadline</span>
                          )}
                        </td>

                        {/* Workspace Action */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <Link
                            href={`/erp/projects/${p.id}`}
                            className={styles.openWorkspaceBtn}
                          >
                            Workspace &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                      No projects matching your search. Click "+ New Project" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deadlines & Recent Activity Grid */}
        <div className={styles.bottomGrid}>
          {/* Deadlines */}
          <div className={styles.panelBox}>
            <h3 className={styles.panelTitle}>
              <span className="material-symbols-outlined" style={{ color: '#f87171', fontSize: '20px' }}>
                event_busy
              </span>
              Upcoming & Overdue Milestones
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {deadlines.length > 0 ? (
                deadlines.map((d: any, idx: number) => {
                  const isOverdue = new Date(d.date).getTime() < new Date().getTime();
                  return (
                    <div
                      key={idx}
                      className={styles.milestoneItem}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className={styles.milestoneName}>
                          {d.name}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Target Delivery Deadline
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: isOverdue ? '#f87171' : '#fbbf24' }}>
                          {new Date(d.date).toLocaleDateString()}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isOverdue ? '#f87171' : '#fbbf24'
                          }}
                        >
                          {isOverdue ? 'OVERDUE' : 'UPCOMING'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '30px 0', fontSize: '13px' }}>
                  No upcoming deadlines on the horizon.
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Activity */}
          <div className={styles.panelBox}>
            <h3 className={styles.panelTitle}>
              <span className="material-symbols-outlined" style={{ color: '#60a5fa', fontSize: '20px' }}>
                history
              </span>
              Recent Portfolio Activity
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
              {activity.length > 0 ? (
                activity.map((act: any) => (
                  <div key={act.id} className={styles.activityItem}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ color: '#60a5fa', fontSize: '16px' }}>
                        task_alt
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong className={styles.activityDesc}>
                          {act.project?.name || 'Project Activity'}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {new Date(act.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                        {act.description}
                      </p>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        By {act.performedBy?.name || 'System'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '30px 0', fontSize: '13px' }}>
                  No recent project activity logged yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: + New Project (Redesigned & Premium) */}
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
                <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                  <span>{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#34d399', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                  <span>{createSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    <label className={styles.fieldLabel}>Project Lead / Manager</label>
                    <div className={styles.selectWrapper}>
                      <span className={`material-symbols-outlined ${styles.inputIcon}`}>person</span>
                      <select
                        value={form.managerId}
                        onChange={(e) => handleFormChange('managerId', e.target.value)}
                        className={styles.fieldSelect}
                      >
                        <option value="">Select Project Manager...</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                          </option>
                        ))}
                      </select>
                      <span className={`material-symbols-outlined ${styles.selectChevron}`}>expand_more</span>
                    </div>
                  </div>
                </div>

                {/* Section: Budget, Cost & Priority */}
                <div className={styles.formSectionDivider}>
                  <span className={styles.formSectionLabel}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#60a5fa' }}>payments</span>
                    Budget, Cost & Priority
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
                        onChange={(e) => handleFormChange('estimatedBudget', e.target.value)}
                        className={`${styles.fieldInput} ${styles.currencyFieldInput}`}
                      />
                    </div>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Already Incurred Cost (Actual Spend)</label>
                    <div className={styles.inputWrapper}>
                      <span className={styles.currencyPrefix}>BDT</span>
                      <input
                        type="number"
                        placeholder="e.g. 50,000 (0 if none)"
                        value={form.actualCost}
                        onChange={(e) => handleFormChange('actualCost', e.target.value)}
                        className={`${styles.fieldInput} ${styles.currencyFieldInput}`}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Priority Level</label>
                  <div className={styles.priorityGrid}>
                    {[
                      { id: 'Low', icon: 'check_circle', activeClass: styles.priorityLowActive },
                      { id: 'Medium', icon: 'adjust', activeClass: styles.priorityMediumActive },
                      { id: 'High', icon: 'priority_high', activeClass: styles.priorityHighActive },
                      { id: 'Urgent', icon: 'bolt', activeClass: styles.priorityUrgentActive },
                    ].map((p) => {
                      const isSelected = form.priority === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleFormChange('priority', p.id)}
                          className={`${styles.priorityChip} ${isSelected ? p.activeClass : ''}`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            {p.icon}
                          </span>
                          {p.id}
                        </button>
                      );
                    })}
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
                    onChange={(e) => handleFormChange('description', e.target.value)}
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
