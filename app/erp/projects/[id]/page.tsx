"use client";

import React, { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import styles from './workspace.module.css';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  designation?: string;
}

const TASK_STAGES = ["To Do", "In Progress", "Review", "Testing", "Completed"];

const STAGE_CONFIG: Record<string, { dot: string; bg: string }> = {
  "To Do": { dot: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
  "In Progress": { dot: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)' },
  "Review": { dot: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)' },
  "Testing": { dot: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
  "Completed": { dot: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' },
};

export default function ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<{ status: number; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "KANBAN" | "TEAM" | "TIMELINE">("OVERVIEW");

  // Inline Quick Actual Cost Edit
  const [isEditingActualCost, setIsEditingActualCost] = useState(false);
  const [actualCostInput, setActualCostInput] = useState<string>("");

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [targetStageForNewTask, setTargetStageForNewTask] = useState<string>("To Do");

  const [editForm, setEditForm] = useState({
    name: '',
    projectCode: '',
    clientName: '',
    category: '',
    priority: 'Medium',
    managerId: '',
    startDate: '',
    endDate: '',
    estimatedBudget: '',
    actualCost: '',
    description: ''
  });

  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assignedToEmployeeId: '',
    estimatedHours: '8',
    dueDate: ''
  });

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchProject = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (res.ok) {
        setProject(data.project);
        setEditForm({
          name: data.project.name || '',
          projectCode: data.project.projectCode || '',
          clientName: data.project.clientName || '',
          category: data.project.category || '',
          priority: data.project.priority || 'Medium',
          managerId: data.project.managerId || '',
          startDate: data.project.startDate ? data.project.startDate.split('T')[0] : '',
          endDate: data.project.endDate ? data.project.endDate.split('T')[0] : '',
          estimatedBudget: data.project.estimatedBudget ? String(data.project.estimatedBudget) : '',
          actualCost: data.project.actualCost ? String(data.project.actualCost) : '',
          description: data.project.description || ''
        });
      } else {
        setApiError({ status: res.status, message: data.error || data.message || `HTTP ${res.status}` });
      }
    } catch (e) {
      setApiError({ status: 0, message: 'Network error connecting to workspace' });
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : data.employees || []);
      }
    } catch (e) {
      console.error("Failed to fetch employees:", e);
    }
  }, []);

  useEffect(() => {
    fetchProject();
    fetchEmployees();
  }, [fetchProject, fetchEmployees]);

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(Number(val || 0));
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Status updated to ${newStatus}`);
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateActualCost = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualCost: Number(actualCostInput) || 0 })
      });
      if (res.ok) {
        setIsEditingActualCost(false);
        showToast("Actual Cost updated");
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProjectDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          clientName: editForm.clientName.trim() || null,
          category: editForm.category.trim() || null,
          priority: editForm.priority,
          managerId: editForm.managerId || null,
          startDate: editForm.startDate || null,
          endDate: editForm.endDate || null,
          estimatedBudget: editForm.estimatedBudget ? Number(editForm.estimatedBudget) : null,
          actualCost: editForm.actualCost ? Number(editForm.actualCost) : 0,
          description: editForm.description.trim() || null
        })
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        showToast("Project parameters updated successfully");
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskForm.title.trim(),
          description: newTaskForm.description.trim() || null,
          priority: newTaskForm.priority,
          status: targetStageForNewTask,
          assignedToEmployeeId: newTaskForm.assignedToEmployeeId || null,
          estimatedHours: Number(newTaskForm.estimatedHours) || 0,
          dueDate: newTaskForm.dueDate || null
        })
      });
      if (res.ok) {
        setIsAddTaskModalOpen(false);
        setNewTaskForm({
          title: '',
          description: '',
          priority: 'Medium',
          assignedToEmployeeId: '',
          estimatedHours: '8',
          dueDate: ''
        });
        showToast("Task created");
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTeamMember = async () => {
    if (!selectedMemberId) return;
    const existingIds = (project.teamMembers || []).map((m: any) => m.id);
    if (existingIds.includes(selectedMemberId)) {
      showToast("Member is already in project");
      return;
    }
    const updatedIds = [...existingIds, selectedMemberId];
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberIds: updatedIds })
      });
      if (res.ok) {
        setIsAddMemberModalOpen(false);
        setSelectedMemberId('');
        showToast("Team member added");
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    const updatedIds = (project.teamMembers || []).filter((m: any) => m.id !== memberId).map((m: any) => m.id);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberIds: updatedIds })
      });
      if (res.ok) {
        showToast("Team member removed");
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Kanban Drag and Drop
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setProject((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t)
    }));

    try {
      await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      fetchProject();
    }
  };

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onDrop = (e: React.DragEvent, status: string) => {
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      updateTaskStatus(taskId, status);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div style={{ textAlign: "center", padding: "100px 20px", color: '#94a3b8' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#c084fc', marginBottom: '16px', display: 'block', animation: 'spin 1s linear infinite' }}>
            autorenew
          </span>
          <h3 style={{ color: '#f8fafc', margin: '0 0 8px 0' }}>Accessing Project Workspace...</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Syncing milestone deliverables, financial burn rate, and tasks.</p>
        </div>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <PageContainer>
        <div style={{ textAlign: "center", padding: "80px 20px", color: '#94a3b8' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#f87171', display: 'block', marginBottom: '16px' }}>
            folder_off
          </span>
          <h2 style={{ color: '#f8fafc', marginBottom: '8px' }}>
            {apiError ? `Error ${apiError.status}: ${apiError.message}` : 'Project Not Found'}
          </h2>
          <p style={{ maxWidth: '420px', margin: '0 auto 24px auto', fontSize: '14px', color: '#64748b' }}>
            This project identifier could not be resolved or was removed.
          </p>
          <button
            onClick={() => router.push('/erp/projects')}
            className={styles.backBtn}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Return to Projects Portfolio
          </button>
        </div>
      </PageContainer>
    );
  }

  // Financial & Progress Computations
  const budget = Number(project.estimatedBudget || 0);
  const actualCost = Number(project.actualCost || 0);
  const burnRate = budget > 0 ? Math.round((actualCost / budget) * 100) : 0;
  const variance = budget - actualCost;
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter((t: any) => t.status === 'Completed').length;
  const totalTasks = tasks.length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress || 0;

  return (
    <PageContainer>
      <div className={styles.workspaceWrapper}>
        {/* Toast Notification */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid #a855f7',
            boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.4)',
            color: '#f8fafc',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span className="material-symbols-outlined" style={{ color: '#34d399', fontSize: '18px' }}>check_circle</span>
            {toastMessage}
          </div>
        )}

        {/* 1. Hero Navigation & Command Header */}
        <div className={styles.heroHeader}>
          <div className={styles.navRow}>
            <Link href="/erp/projects" className={styles.backBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
              Portfolio
            </Link>

            <div className={styles.headerActionGroup}>
              {/* Status Select */}
              <div className={styles.statusSelectWrapper}>
                <select
                  value={project.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={styles.statusSelect}
                  style={{
                    borderColor: project.status === 'Active' ? 'rgba(16, 185, 129, 0.4)' : undefined,
                    color: project.status === 'Active' ? '#10b981' : undefined
                  }}
                >
                  {["Draft", "Planning", "Active", "On Hold", "Completed", "Cancelled", "Archived"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className={`material-symbols-outlined ${styles.statusSelectChevron}`}>expand_more</span>
              </div>

              {/* Edit Project Button */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className={styles.editBtn}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                Edit Project
              </button>
            </div>
          </div>

          <div className={styles.titleRow}>
            <div className={styles.titleGroup}>
              <div className={styles.tagRow}>
                <span className={styles.codePill}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>tag</span>
                  {project.projectCode || 'NO-CODE'}
                </span>

                <span className={`${styles.priorityPill} ${
                  project.priority === 'Urgent' ? styles.priorityUrgent :
                  project.priority === 'High' ? styles.priorityHigh :
                  project.priority === 'Low' ? styles.priorityLow :
                  styles.priorityMedium
                }`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    {project.priority === 'Urgent' ? 'bolt' :
                     project.priority === 'High' ? 'priority_high' :
                     project.priority === 'Low' ? 'check_circle' : 'adjust'}
                  </span>
                  {project.priority || 'Medium'} Priority
                </span>

                {project.category && (
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', color: '#94a3b8' }}>
                    {project.category}
                  </span>
                )}
              </div>

              <h1 className={styles.projectTitle}>
                {project.name}
              </h1>

              <div className={styles.metaRow}>
                <span className={styles.metaItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#60a5fa' }}>domain</span>
                  Client: <strong>{project.clientName || 'Internal Company'}</strong>
                </span>

                <span className={styles.metaItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#c084fc' }}>person</span>
                  Lead Manager: <strong>{project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : 'Unassigned'}</strong>
                </span>

                <span className={styles.metaItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#34d399' }}>calendar_today</span>
                  Target Delivery: <strong>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Unscheduled'}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Executive 4-KPI Metric Cards */}
        <div className={styles.kpiGrid}>
          {/* Card 1: Estimated Budget */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIconBox} style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa' }}>
                <span className="material-symbols-outlined">payments</span>
              </div>
              <span className={styles.kpiBadge} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                Allocated
              </span>
            </div>
            <div>
              <span className={styles.kpiLabel}>Estimated Budget</span>
              <div className={styles.kpiMainValue}>
                {formatCurrency(budget)}
              </div>
            </div>
            <div className={styles.kpiFooter}>
              <span>Target Ceiling</span>
              <span>100% Total</span>
            </div>
          </div>

          {/* Card 2: Actual Cost (with inline edit) */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIconBox} style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <span className={styles.kpiBadge} style={{
                background: burnRate > 100 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                color: burnRate > 100 ? '#f87171' : '#fbbf24'
              }}>
                {burnRate}% Burned
              </span>
            </div>
            <div>
              <span className={styles.kpiLabel}>Actual Incurred Cost</span>
              {isEditingActualCost ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                  <input
                    type="number"
                    value={actualCostInput}
                    onChange={(e) => setActualCostInput(e.target.value)}
                    className={styles.actualCostInput}
                  />
                  <button
                    onClick={handleUpdateActualCost}
                    style={{ padding: '4px 8px', borderRadius: '6px', background: '#9333ea', color: '#fff', border: 'none', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingActualCost(false)}
                    style={{ padding: '4px 6px', borderRadius: '6px', background: 'rgba(100,116,139,0.2)', color: 'var(--text-muted, #94a3b8)', border: 'none', fontSize: '11px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className={styles.kpiMainValue} style={{ color: burnRate > 100 ? '#ef4444' : undefined }}>
                  <span>{formatCurrency(actualCost)}</span>
                  <button
                    onClick={() => { setIsEditingActualCost(true); setActualCostInput(String(actualCost)); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: '4px' }}
                    title="Edit Actual Cost"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                  </button>
                </div>
              )}
            </div>
            <div className={styles.kpiFooter}>
              <span>{budget > actualCost ? `Savings: ${formatCurrency(variance)}` : `Over Budget by ${formatCurrency(Math.abs(variance))}`}</span>
            </div>
          </div>

          {/* Card 3: Remaining Capital Buffer */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <span className={styles.kpiBadge} style={{ background: variance >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: variance >= 0 ? '#34d399' : '#f87171' }}>
                {variance >= 0 ? 'Positive Buffer' : 'Deficit'}
              </span>
            </div>
            <div>
              <span className={styles.kpiLabel}>Remaining Capital Buffer</span>
              <div className={styles.kpiMainValue} style={{ color: variance >= 0 ? '#34d399' : '#f87171' }}>
                {formatCurrency(variance)}
              </div>
            </div>
            <div className={styles.kpiFooter}>
              <span>{Math.max(0, 100 - burnRate)}% Available</span>
              <span>Safe Runway</span>
            </div>
          </div>

          {/* Card 4: Milestone Velocity & Progress */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIconBox} style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc' }}>
                <span className="material-symbols-outlined">donut_large</span>
              </div>
              <span className={styles.kpiBadge} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                {taskProgress}% Done
              </span>
            </div>
            <div>
              <span className={styles.kpiLabel}>Overall Progress</span>
              <div className={styles.kpiMainValue}>
                {taskProgress}%
              </div>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min(taskProgress, 100)}%`,
                  background: taskProgress === 100 ? '#10b981' : 'linear-gradient(90deg, #9333ea, #3b82f6)'
                }}
              />
            </div>
            <div className={styles.kpiFooter}>
              <span>{completedTasks} of {totalTasks} Tasks</span>
              <span>Velocity</span>
            </div>
          </div>
        </div>

        {/* 3. Segmented Tabs Navigation */}
        <div className={styles.tabsContainer}>
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`${styles.tabItem} ${activeTab === "OVERVIEW" ? styles.activeTab : ""}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>analytics</span>
            Overview & Intelligence
          </button>

          <button
            onClick={() => setActiveTab("KANBAN")}
            className={`${styles.tabItem} ${activeTab === "KANBAN" ? styles.activeTab : ""}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>view_kanban</span>
            Kanban Board
            <span className={styles.tabCountBadge}>{tasks.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("TEAM")}
            className={`${styles.tabItem} ${activeTab === "TEAM" ? styles.activeTab : ""}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>group</span>
            Team & Leadership
            <span className={styles.tabCountBadge}>{project.teamMembers?.length || 0}</span>
          </button>

          <button
            onClick={() => setActiveTab("TIMELINE")}
            className={`${styles.tabItem} ${activeTab === "TIMELINE" ? styles.activeTab : ""}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
            Audit & Activity Trail
            <span className={styles.tabCountBadge}>{project.activities?.length || 0}</span>
          </button>
        </div>

        {/* 4. Tab Content: OVERVIEW */}
        {activeTab === "OVERVIEW" && (
          <div className={styles.overviewGrid}>
            {/* Left Column: Scope & Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Scope & Objectives */}
              <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#c084fc' }}>description</span>
                    Scope & Narrative Summary
                  </h3>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                    Edit
                  </button>
                </div>

                <div className={`${styles.descriptionBox} ${!project.description ? styles.descriptionEmpty : ''}`}>
                  {project.description || "No project description or scope documented yet. Click 'Edit Project' to configure deliverables and milestones."}
                </div>

                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Category / Segment</span>
                    <span className={styles.detailValue}>{project.category || 'General ERP Project'}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>CRM Lead Link</span>
                    <span className={styles.detailValue}>
                      {project.lead ? (
                        <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>link</span>
                          {project.lead.companyName}
                        </span>
                      ) : 'None Attached'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Timeline Tracker */}
              <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#34d399' }}>calendar_month</span>
                    Milestone Schedule & Dates
                  </h3>
                </div>

                <div className={styles.timelineBox}>
                  <div className={styles.timelineBarHeader}>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Kickoff Date</span>
                      <strong className={styles.timelineValue}>
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not Set'}
                      </strong>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Delivery Deadline</span>
                      <strong className={styles.timelineValue}>
                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Open-Ended'}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.progressBar} style={{ height: '8px' }}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${Math.min(taskProgress, 100)}%`,
                        background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Key Leadership & Collaborators */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Leadership & Stakeholder Card */}
              <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#60a5fa' }}>badge</span>
                    Leadership & Stakeholders
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Manager */}
                  <div className={styles.stakeholderCard}>
                    <div className={styles.avatarBadge} style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
                      {project.manager ? `${project.manager.firstName[0]}${project.manager.lastName[0]}` : 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Project Manager</span>
                      <strong className={styles.stakeholderTitle}>
                        {project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : 'Unassigned'}
                      </strong>
                    </div>
                  </div>

                  {/* Client */}
                  <div className={styles.stakeholderCard}>
                    <div className={styles.avatarBadge} style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.4)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>domain</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Client Organization</span>
                      <strong className={styles.stakeholderTitle}>
                        {project.clientName || 'Internal Company'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Members Snapshot */}
              <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#34d399' }}>group</span>
                    Assigned Team ({project.teamMembers?.length || 0})
                  </h3>
                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    style={{
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#c084fc',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                    Assign
                  </button>
                </div>

                <div className={styles.memberList}>
                  {project.teamMembers && project.teamMembers.length > 0 ? (
                    project.teamMembers.slice(0, 4).map((m: any) => (
                      <div key={m.id} className={styles.memberItem}>
                        <div className={styles.memberProfile}>
                          <div className={styles.avatarBadge}>
                            {m.firstName?.[0] || 'M'}{m.lastName?.[0] || ''}
                          </div>
                          <div>
                            <div className={styles.memberName}>{m.firstName} {m.lastName}</div>
                            <div className={styles.memberRole}>{m.designation || m.email || 'Member'}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: '13px' }}>
                      No team members assigned yet.
                    </div>
                  )}

                  {project.teamMembers?.length > 4 && (
                    <button
                      onClick={() => setActiveTab("TEAM")}
                      style={{ background: 'none', border: 'none', color: '#c084fc', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}
                    >
                      View all {project.teamMembers.length} collaborators →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Tab Content: KANBAN BOARD */}
        {activeTab === "KANBAN" && (
          <div className={styles.kanbanBoard}>
            {TASK_STAGES.map((status) => {
              const stageTasks = tasks.filter((t: any) => t.status === status);
              const config = STAGE_CONFIG[status] || { dot: '#94a3b8', bg: 'rgba(255,255,255,0.1)' };

              return (
                <div
                  key={status}
                  className={styles.kanbanCol}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, status)}
                >
                  <div className={styles.kanbanColHeader}>
                    <div className={styles.colTitleGroup}>
                      <span className={styles.colDot} style={{ background: config.dot }} />
                      <span className={styles.colTitle}>{status}</span>
                    </div>
                    <span className={styles.colBadge}>
                      {stageTasks.length}
                    </span>
                  </div>

                  <div className={styles.taskList}>
                    {stageTasks.map((task: any) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, task.id)}
                        className={styles.taskCard}
                      >
                        <div className={styles.taskTitle}>{task.title}</div>

                        <div className={styles.taskMeta}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                            {task.employee ? task.employee.firstName : 'Unassigned'}
                          </span>

                          <span className={styles.taskHours}>
                            {task.actualHours || 0}/{task.estimatedHours || 0}h
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setTargetStageForNewTask(status);
                      setIsAddTaskModalOpen(true);
                    }}
                    className={styles.addTaskBtn}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                    Add Task
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 6. Tab Content: TEAM & LEADERSHIP */}
        {activeTab === "TEAM" && (
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <span className="material-symbols-outlined" style={{ color: '#34d399' }}>group</span>
                Project Team Roster ({project.teamMembers?.length || 0})
              </h3>

              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className={styles.editBtn}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_add</span>
                Assign New Collaborator
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {project.teamMembers && project.teamMembers.length > 0 ? (
                project.teamMembers.map((m: any) => (
                  <div key={m.id} className={styles.memberItem} style={{ padding: '16px' }}>
                    <div className={styles.memberProfile}>
                      <div className={styles.avatarBadge} style={{ width: '44px', height: '44px', fontSize: '15px' }}>
                        {m.firstName?.[0] || 'M'}{m.lastName?.[0] || ''}
                      </div>
                      <div>
                        <div className={styles.memberName} style={{ fontSize: '15px' }}>{m.firstName} {m.lastName}</div>
                        <div className={styles.memberRole}>{m.designation || 'Project Collaborator'}</div>
                        {m.email && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{m.email}</div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveTeamMember(m.id)}
                      title="Remove Member"
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_remove</span>
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '42px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>group_off</span>
                  No collaborators assigned yet. Click "Assign New Collaborator" to add team members.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Tab Content: AUDIT & ACTIVITY TRAIL */}
        {activeTab === "TIMELINE" && (
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <span className="material-symbols-outlined" style={{ color: '#c084fc' }}>history</span>
                Audit & Activity Trail ({project.activities?.length || 0})
              </h3>
            </div>

            <div className={styles.timelineFeed}>
              <div className={styles.timelineTrack} />

              {project.activities && project.activities.length > 0 ? (
                project.activities.map((act: any) => (
                  <div key={act.id} className={styles.timelineItem}>
                    <div
                      className={styles.timelineNode}
                      style={{
                        background: act.type.includes('TASK') ? 'rgba(245, 158, 11, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                        border: act.type.includes('TASK') ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)',
                        color: act.type.includes('TASK') ? '#fbbf24' : '#c084fc'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {act.type.includes('TASK') ? 'task_alt' :
                         act.type.includes('STATUS') ? 'published_with_changes' : 'folder'}
                      </span>
                    </div>

                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelineType}>{act.type.replace(/_/g, " ")}</span>
                        <span className={styles.timelineTime}>{new Date(act.createdAt).toLocaleString()}</span>
                      </div>

                      <div className={styles.timelineDesc}>{act.description}</div>

                      {(act.oldValue || act.newValue) && (
                        <div className={styles.timelineChangeBox}>
                          {act.oldValue && <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>{act.oldValue}</span>}
                          {act.oldValue && act.newValue && <span style={{ color: '#64748b' }}>➔</span>}
                          {act.newValue && <strong style={{ color: '#10b981' }}>{act.newValue}</strong>}
                        </div>
                      )}

                      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>person</span>
                        Triggered by {act.performedBy?.name || 'Authorized Member'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>history_toggle_drop</span>
                  No recorded activity yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL: EDIT PROJECT PARAMETERS (SOLID OPAQUE)
            ==================================================================== */}
        {isEditModalOpen && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  Edit Project Parameters
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className={styles.closeBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>

              <form onSubmit={handleSaveProjectDetails} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Project Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Client Name</label>
                    <input
                      type="text"
                      value={editForm.clientName}
                      onChange={(e) => setEditForm(f => ({ ...f, clientName: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Project Manager</label>
                    <select
                      value={editForm.managerId}
                      onChange={(e) => setEditForm(f => ({ ...f, managerId: e.target.value }))}
                      className={styles.inputField}
                    >
                      <option value="">Select Manager...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Priority Level</label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm(f => ({ ...f, priority: e.target.value }))}
                      className={styles.inputField}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Estimated Budget (BDT)</label>
                    <input
                      type="number"
                      value={editForm.estimatedBudget}
                      onChange={(e) => setEditForm(f => ({ ...f, estimatedBudget: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Already Incurred Cost (BDT)</label>
                    <input
                      type="number"
                      value={editForm.actualCost}
                      onChange={(e) => setEditForm(f => ({ ...f, actualCost: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Start Date</label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm(f => ({ ...f, startDate: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Delivery Date</label>
                    <input
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Scope & Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                    className={styles.inputField}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className={styles.backBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={styles.submitBtn}
                  >
                    {submitting ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL: ADD KANBAN TASK (SOLID OPAQUE)
            ==================================================================== */}
        {isAddTaskModalOpen && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsAddTaskModalOpen(false); }}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  Create New Task ({targetStageForNewTask})
                </h3>
                <button onClick={() => setIsAddTaskModalOpen(false)} className={styles.closeBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>

              <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Implement OAuth2 Gateway"
                    value={newTaskForm.title}
                    onChange={(e) => setNewTaskForm(f => ({ ...f, title: e.target.value }))}
                    className={styles.inputField}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Assignee</label>
                    <select
                      value={newTaskForm.assignedToEmployeeId}
                      onChange={(e) => setNewTaskForm(f => ({ ...f, assignedToEmployeeId: e.target.value }))}
                      className={styles.inputField}
                    >
                      <option value="">Unassigned</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Estimated Hours</label>
                    <input
                      type="number"
                      value={newTaskForm.estimatedHours}
                      onChange={(e) => setNewTaskForm(f => ({ ...f, estimatedHours: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Priority</label>
                    <select
                      value={newTaskForm.priority}
                      onChange={(e) => setNewTaskForm(f => ({ ...f, priority: e.target.value }))}
                      className={styles.inputField}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Due Date</label>
                    <input
                      type="date"
                      value={newTaskForm.dueDate}
                      onChange={(e) => setNewTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Description</label>
                  <textarea
                    rows={2}
                    placeholder="Specific acceptance criteria or details..."
                    value={newTaskForm.description}
                    onChange={(e) => setNewTaskForm(f => ({ ...f, description: e.target.value }))}
                    className={styles.inputField}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddTaskModalOpen(false)}
                    className={styles.backBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={styles.submitBtn}
                  >
                    {submitting ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL: ASSIGN TEAM MEMBER (SOLID OPAQUE)
            ==================================================================== */}
        {isAddMemberModalOpen && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsAddMemberModalOpen(false); }}>
            <div className={styles.modalContent} style={{ maxWidth: '460px' }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  Assign Collaborator to Project
                </h3>
                <button onClick={() => setIsAddMemberModalOpen(false)} className={styles.closeBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    Select Team Member from Directory
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className={styles.inputField}
                  >
                    <option value="">Choose Employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.designation || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddMemberModalOpen(false)}
                    className={styles.backBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedMemberId}
                    onClick={handleAddTeamMember}
                    className={styles.submitBtn}
                  >
                    Assign Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
