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
  employmentType?: string;
  basicSalary?: number | string;
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
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [targetStageForNewTask, setTargetStageForNewTask] = useState<string>("To Do");

  // Payment Form State
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    customCost: '',
    costReason: '',
    paymentMethod: 'Bank Transfer',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [costForm, setCostForm] = useState({ amount: '', reason: '' });
  const [isSubmittingCost, setIsSubmittingCost] = useState(false);

  // Edit Payment State
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentForm, setEditPaymentForm] = useState({
    amount: '',
    customCost: '',
    costReason: '',
    paymentMethod: 'Bank Transfer',
    notes: '',
    date: ''
  });
  const [isSubmittingEditPayment, setIsSubmittingEditPayment] = useState(false);

  // Delete Item (Payment / Cost) State
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<{
    id: string;
    type: 'payment' | 'expense';
    title: string;
    amount?: number;
    label?: string;
  } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Delete Project Modal State
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Multi-Employee Assignment State
  const [selectedMemberConfigs, setSelectedMemberConfigs] = useState<Record<string, { selected: boolean; isProjectBased: boolean; rate: string }>>({});
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<'ALL' | 'PROJECT_BASED' | 'SALARIED'>('ALL');
  const [isSubmittingMembers, setIsSubmittingMembers] = useState(false);

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

  useEffect(() => {
    if (isAddMemberModalOpen && employees.length > 0 && project) {
      const configs: Record<string, { selected: boolean; isProjectBased: boolean; rate: string }> = {};
      employees.forEach(emp => {
        const existingPE = (project.projectEmployees || []).find((pe: any) => pe.employeeId === emp.id);
        const isInTeam = existingPE || (project.teamMembers || []).some((m: any) => m.id === emp.id);
        const isProjectBased = existingPE ? existingPE.isProjectBased : (emp.employmentType === 'Project-Based');
        const rate = existingPE ? String(existingPE.rate) : (isProjectBased ? String(emp.basicSalary || 0) : '0');

        configs[emp.id] = {
          selected: !!isInTeam,
          isProjectBased,
          rate
        };
      });
      setSelectedMemberConfigs(configs);
    }
  }, [isAddMemberModalOpen, employees, project]);

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

  const handleSaveMultiMembers = async () => {
    const selectedList = Object.entries(selectedMemberConfigs)
      .filter(([_, cfg]) => cfg.selected)
      .map(([empId, cfg]) => ({
        employeeId: empId,
        isProjectBased: cfg.isProjectBased,
        rate: parseFloat(cfg.rate) || 0
      }));

    if (selectedList.length === 0) {
      showToast("Please select at least one employee to assign");
      return;
    }

    setIsSubmittingMembers(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: selectedList })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Collaborators assigned");
        setIsAddMemberModalOpen(false);
        fetchProject();
      } else {
        showToast(data.error || "Failed to assign collaborators");
      }
    } catch (err) {
      showToast("Network error assigning collaborators");
    } finally {
      setIsSubmittingMembers(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/team`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: memberId })
      });
      if (res.ok) {
        showToast("Member removed from project");
        fetchProject();
      } else {
        showToast("Failed to remove member");
      }
    } catch (e) {
      console.error(e);
      showToast("Network error removing member");
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      showToast("Please enter a valid payment amount");
      return;
    }
    const costAmt = parseFloat(paymentForm.customCost) || 0;
    setIsSubmittingPayment(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentForm)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || (costAmt > 0 ? "Payment recorded & cost deducted from budget" : "Payment processed successfully"));
        setIsAddPaymentModalOpen(false);
        setPaymentForm({
          amount: '',
          customCost: '',
          costReason: '',
          paymentMethod: 'Bank Transfer',
          notes: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchProject();
      } else {
        showToast(data.error || "Failed to record payment");
      }
    } catch (err) {
      showToast("Network error saving payment");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleSaveCost = async () => {
    const amt = parseFloat(costForm.amount);
    if (isNaN(amt) || amt <= 0) {
      showToast("Please enter a valid cost amount");
      return;
    }
    setIsSubmittingCost(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: costForm.amount, reason: costForm.reason })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Cost deducted from budget");
        setCostForm({ amount: '', reason: '' });
        fetchProject();
      } else {
        showToast(data.error || "Failed to add cost");
      }
    } catch (err) {
      showToast("Network error saving cost");
    } finally {
      setIsSubmittingCost(false);
    }
  };

  const handleOpenEditPayment = (record: any) => {
    const costInfo = parsePaymentCost(record.notes);
    const userNote = record.notes && costInfo
      ? record.notes.replace(costInfo.fullTag, '').replace(/^[•\s]+|[•\s]+$/g, '')
      : (record.notes || '');

    setEditingPaymentId(record.id);
    setEditPaymentForm({
      amount: String(record.amount || ''),
      customCost: costInfo ? costInfo.amountStr.replace(/[^0-9.]/g, '') : '',
      costReason: costInfo ? costInfo.reason : '',
      paymentMethod: record.paymentMethod || 'Bank Transfer',
      notes: userNote,
      date: record.createdAt ? record.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsEditPaymentModalOpen(true);
  };

  const handleSaveEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaymentId) return;
    const amt = parseFloat(editPaymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      showToast("Please enter a valid payment amount");
      return;
    }
    setIsSubmittingEditPayment(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/payments/${editingPaymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPaymentForm)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Payment updated successfully");
        setIsEditPaymentModalOpen(false);
        setEditingPaymentId(null);
        fetchProject();
      } else {
        showToast(data.error || "Failed to update payment");
      }
    } catch (err) {
      showToast("Network error updating payment");
    } finally {
      setIsSubmittingEditPayment(false);
    }
  };

  const handleExecuteDeleteItem = async () => {
    if (!deleteItemConfirm) return;
    setIsDeletingItem(true);
    try {
      let res;
      if (deleteItemConfirm.type === 'payment') {
        res = await fetch(`/api/projects/${projectId}/payments/${deleteItemConfirm.id}`, {
          method: "DELETE"
        });
      } else {
        res = await fetch(`/api/projects/${projectId}/costs?costId=${deleteItemConfirm.id}`, {
          method: "DELETE"
        });
      }
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `${deleteItemConfirm.type === 'payment' ? 'Payment' : 'Cost'} deleted successfully`);
        setDeleteItemConfirm(null);
        fetchProject();
      } else {
        showToast(data.error || "Failed to delete item");
      }
    } catch (err) {
      showToast("Network error deleting item");
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeletingProject(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Project deleted successfully");
        router.push("/erp/projects");
      } else {
        showToast(data.error || "Failed to delete project");
      }
    } catch (err) {
      showToast("Network error deleting project");
    } finally {
      setIsDeletingProject(false);
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

  // Project Financials & Payout Computations
  const payments = project.payments || [];
  const projectEmployees = project.projectEmployees || [];
  const totalReceived = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const clientDue = Math.max(0, budget - totalReceived);

  // Project-based employees
  const projectBasedStaff = projectEmployees.filter((pe: any) => pe.isProjectBased);
  const totalStaffRate = projectBasedStaff.reduce((sum: number, pe: any) => sum + Number(pe.rate || 0), 0);
  const totalStaffPaid = projectBasedStaff.reduce((sum: number, pe: any) => sum + Number(pe.paidAmount || 0), 0);
  const totalStaffDue = Math.max(0, totalStaffRate - totalStaffPaid);

  const expenses = project.expenses || [];
  
  // Helper to extract custom cost from payment notes
  const parsePaymentCost = (notes: string | null) => {
    if (!notes) return null;
    const match = notes.match(/\[Custom Cost:\s*(-?৳?[0-9,]+(?:\.[0-9]+)?)(?:\s*\(([^)]+)\))?[^\]]*\]/i);
    if (match) {
      return {
        amountStr: match[1],
        reason: match[2] || '',
        fullTag: match[0]
      };
    }
    return null;
  };

  // Combine payments and expenses into history array
  // Filter out expenses that were generated during a client payment to prevent duplicate display
  const standaloneExpenses = expenses.filter(
    (e: any) => !e.description?.includes('during client payment') && !e.description?.includes('(deducted from budget)')
  );

  const financialHistory = [
    ...payments.map((p: any) => ({ ...p, _type: 'payment' })),
    ...standaloneExpenses.map((e: any) => ({ ...e, _type: 'expense' }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Profit
  // Calculated holistically: everything received from client minus everything spent (staff payouts + custom costs)
  const totalProfit = totalReceived - actualCost;

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

        {/* Print-Only Executive Header */}
        <div className={styles.printOnlyHeader}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20pt', fontWeight: 800, color: '#0f172a' }}>{project.name}</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '11pt', color: '#475569' }}>
              Project Code: <strong>{project.projectCode || 'N/A'}</strong> • Client: <strong>{project.clientName || 'Internal'}</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10pt', color: '#475569' }}>
            <div>Status: <strong style={{ color: '#0f172a' }}>{project.status}</strong> • Priority: <strong style={{ color: '#0f172a' }}>{project.priority}</strong></div>
            <div>Generated: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

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
                title="Edit Project Parameters"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                Edit Project
              </button>

              {/* Print Project Report Button */}
              <button
                type="button"
                onClick={() => window.print()}
                className={styles.printBtn}
                title="Print Project Report"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>print</span>
                Print Report
              </button>

              {/* Delete Project Button */}
              <button
                type="button"
                onClick={() => setIsDeleteProjectModalOpen(true)}
                className={styles.deleteBtn}
                title="Delete Project Permanently"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                Delete Project
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

            {/* Right Column: Key Leadership & Financials */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 1. Project Financials & Settlement Card (Directly opposite Scope & Narrative Summary) */}
              <div className={styles.paymentCard}>
                <div className={styles.paymentHeader}>
                  <div className={styles.paymentHeaderLeft}>
                    <div className={styles.paymentIconBox}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_balance_wallet</span>
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Financials & Settlement
                      </h3>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Live client collections, staff payouts & profit split</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAddPaymentModalOpen(true)}
                    className={styles.addPaymentBtn}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                    Add Payment
                  </button>
                </div>

                {/* 3-Col KPI Grid */}
                <div className={styles.financialGrid}>
                  <div className={styles.financialItem}>
                    <span className={styles.financialLabel}>Project Budget</span>
                    <span className={styles.financialValue}>{formatCurrency(budget)}</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Target Contract</span>
                  </div>

                  <div className={styles.financialItem}>
                    <span className={styles.financialLabel}>Total Received</span>
                    <span className={styles.financialValue} style={{ color: '#34d399' }}>
                      {formatCurrency(totalReceived)}
                    </span>
                    <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
                      {budget > 0 ? `${Math.round((totalReceived / budget) * 100)}% Collected` : 'Received'}
                    </span>
                  </div>

                  <div className={styles.financialItem}>
                    <span className={styles.financialLabel}>Client Due</span>
                    <span className={styles.financialValue} style={{ color: clientDue > 0 ? '#f87171' : '#34d399' }}>
                      {formatCurrency(clientDue)}
                    </span>
                    <span className={styles.dueBadge} style={{
                      background: clientDue === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: clientDue === 0 ? '#34d399' : '#f87171',
                      alignSelf: 'flex-start',
                      marginTop: '2px'
                    }}>
                      {clientDue === 0 ? 'Settled' : 'Payment Due'}
                    </span>
                  </div>
                </div>

                {/* Staff Auto-Payout & Due Section */}
                <div className={styles.staffSection}>
                  <div className={styles.staffHeader}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#c084fc' }}>group_work</span>
                      Project-Based Staff Allocation ({projectBasedStaff.length})
                    </span>
                    <span className={styles.dueBadge} style={{
                      background: totalStaffDue === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: totalStaffDue === 0 ? '#34d399' : '#fbbf24',
                      border: totalStaffDue === 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                    }}>
                      {totalStaffDue === 0 ? 'All Staff Paid' : `Staff Due: ${formatCurrency(totalStaffDue)}`}
                    </span>
                  </div>

                  {projectBasedStaff.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {projectBasedStaff.map((pe: any) => {
                        const fee = Number(pe.rate || 0);
                        const paid = Number(pe.paidAmount || 0);
                        const due = Math.max(0, fee - paid);
                        const emp = pe.employee || {};
                        return (
                          <div key={pe.id} className={styles.staffRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className={styles.avatarBadge} style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                                {emp.firstName?.[0] || 'E'}{emp.lastName?.[0] || ''}
                              </div>
                              <div>
                                <span style={{ fontWeight: 600, color: '#f8fafc', display: 'block' }}>
                                  {emp.firstName} {emp.lastName}
                                </span>
                                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                                  {emp.designation || 'Staff'}
                                </span>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div>
                                <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>
                                  Fee: <strong>{formatCurrency(fee)}</strong>
                                </span>
                                <span style={{ display: 'block', fontSize: '10px', color: paid > 0 ? '#34d399' : '#64748b' }}>
                                  Paid: {formatCurrency(paid)}
                                </span>
                              </div>
                              <span className={styles.dueBadge} style={{
                                background: due === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: due === 0 ? '#34d399' : '#f87171'
                              }}>
                                {due === 0 ? 'Paid' : `Due ${formatCurrency(due)}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', padding: '6px 0' }}>
                      No project-based employees assigned. Assign staff with contract rates to enable automatic payout splitting.
                    </div>
                  )}
                </div>

                {/* Profit & Settlement Banner */}
                <div className={styles.profitBanner}>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Accounting & Ledger Result
                    </span>
                    <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
                      Staff Due Cutting (Expenses): <strong style={{ color: '#f87171' }}>-{formatCurrency(totalStaffPaid)}</strong>
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '10px', color: totalProfit >= 0 ? '#10b981' : '#f87171', textTransform: 'uppercase', fontWeight: 700 }}>
                      {totalProfit >= 0 ? 'Saved to Income (Profit)' : 'Project Loss'}
                    </span>
                    <strong style={{ fontSize: '18px', color: totalProfit >= 0 ? '#34d399' : '#f87171', fontWeight: 800 }}>
                      {totalProfit > 0 ? '+' : ''}{formatCurrency(totalProfit)}
                    </strong>
                  </div>
                </div>

                {/* Add Cost Section */}
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', padding: '12px', marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fca5a5', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>price_change</span>
                    Add Project Cost
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Cost Name (e.g. Server hosting, Subcontractor)" className={styles.inputField} value={costForm.reason} onChange={(e) => setCostForm({ ...costForm, reason: e.target.value })} style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }} />
                    <input type="number" placeholder="Amount" className={styles.inputField} value={costForm.amount} onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })} style={{ width: '100px', fontSize: '12px', padding: '8px 12px' }} />
                    <button onClick={handleSaveCost} disabled={isSubmittingCost} className={styles.submitBtn} style={{ padding: '8px 16px', fontSize: '12px', background: '#ef4444', borderColor: '#ef4444', cursor: 'pointer' }}>
                      {isSubmittingCost ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Recent Payments Breakdown */}
                {financialHistory.length > 0 && (
                  <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                        Payment & Cost History ({financialHistory.length})
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {financialHistory.slice(0, 15).map((record: any) => {
                        const costInfo = record._type === 'payment' ? parsePaymentCost(record.notes) : null;
                        const userNote = record.notes && costInfo
                          ? record.notes.replace(costInfo.fullTag, '').replace(/^[•\s]+|[•\s]+$/g, '')
                          : record.notes;

                        return (
                          <div key={record.id} className={styles.paymentHistoryItem}>
                            <div>
                              {record._type === 'payment' ? (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <strong style={{ color: '#f8fafc', fontSize: '13px' }}>+{formatCurrency(Number(record.amount))}</strong>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                      via {record.paymentMethod}
                                    </span>
                                  </div>

                                  {costInfo && (
                                    <div style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: 'rgba(239, 68, 68, 0.12)',
                                      border: '1px solid rgba(239, 68, 68, 0.25)',
                                      color: '#fca5a5',
                                      borderRadius: '6px',
                                      padding: '2px 8px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      marginTop: '4px'
                                    }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#ef4444' }}>price_change</span>
                                      <span>Cost: {costInfo.amountStr} {costInfo.reason ? `(${costInfo.reason})` : ''}</span>
                                    </div>
                                  )}

                                  {userNote ? (
                                    <span style={{
                                      fontSize: '11px',
                                      color: '#64748b',
                                      display: 'block',
                                      marginTop: '2px'
                                    }}>
                                      {userNote}
                                    </span>
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <strong style={{ color: '#f87171', fontSize: '13px' }}>-{formatCurrency(Number(record.amount))}</strong>
                                    <span style={{
                                      background: 'rgba(239, 68, 68, 0.15)',
                                      color: '#ef4444',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      padding: '1px 5px',
                                      letterSpacing: '0.5px'
                                    }}>
                                      COST
                                    </span>
                                  </div>
                                  {record.description && (
                                    <span style={{
                                      fontSize: '11px',
                                      color: '#fca5a5',
                                      display: 'block',
                                      marginTop: '2px'
                                    }}>
                                      {record.description}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '8px' }}>
                              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>
                                {new Date(record.createdAt).toLocaleDateString()}
                              </span>
                              {record._type === 'payment' && (
                                <span style={{ fontSize: '10px', color: '#34d399', display: 'block', marginTop: '2px' }}>
                                  Staff: {formatCurrency(Number(record.paidToStaff))} • Profit: {formatCurrency(Number(record.profit))}
                                </span>
                              )}
                              <div className={styles.historyActionGroup}>
                                {record._type === 'payment' && (
                                  <button
                                    type="button"
                                    className={`${styles.historyActionBtn} ${styles.historyEditBtn}`}
                                    onClick={() => handleOpenEditPayment(record)}
                                    title="Edit payment"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>edit</span>
                                    <span>Edit</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={`${styles.historyActionBtn} ${styles.historyDeleteBtn}`}
                                  onClick={() => setDeleteItemConfirm({
                                    id: record.id,
                                    type: record._type,
                                    title: record._type === 'payment'
                                      ? `Payment of ${formatCurrency(Number(record.amount))}`
                                      : `Cost of ${formatCurrency(Number(record.amount))} (${record.description || 'Custom Cost'})`
                                  })}
                                  title={`Delete ${record._type}`}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>delete</span>
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

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
                      <div style={{ flex: 1 }}>
                        <div className={styles.memberName} style={{ fontSize: '15px' }}>{m.firstName} {m.lastName}</div>
                        <div className={styles.memberRole}>{m.designation || 'Project Collaborator'}</div>
                        
                        {/* Compensation Type Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                          {m.employmentType === 'Project-Based' ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: 'rgba(139, 92, 246, 0.15)',
                              color: '#c084fc',
                              border: '1px solid rgba(139, 92, 246, 0.3)'
                            }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>folder_special</span>
                              Project-Based {Number(m.basicSalary) > 0 ? `(৳${Number(m.basicSalary).toLocaleString()} fee)` : ''}
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.25)'
                            }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>payments</span>
                              Monthly Staff
                            </span>
                          )}
                        </div>

                        {m.email && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{m.email}</div>
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
            MODAL: ADD PROJECT PAYMENT (AUTO-PAYOUT & PROFIT)
            ==================================================================== */}
        {isAddPaymentModalOpen && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsAddPaymentModalOpen(false); }}>
            <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#34d399' }}>payments</span>
                  Record Client Payment
                </h3>
                <button onClick={() => setIsAddPaymentModalOpen(false)} className={styles.closeBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>

              <form onSubmit={handleSavePayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#94a3b8'
                }}>
                  <span>Budget: <strong style={{ color: '#f8fafc' }}>{formatCurrency(budget)}</strong></span>
                  <span>Received: <strong style={{ color: '#34d399' }}>{formatCurrency(totalReceived)}</strong></span>
                  <span>Current Due: <strong style={{ color: '#f87171' }}>{formatCurrency(clientDue)}</strong></span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Received Payment Amount (BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                    className={styles.inputField}
                    style={{ fontSize: '16px', fontWeight: 700 }}
                  />
                </div>

                {/* Custom Cost Deduction Field */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.22)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>price_change</span>
                      Custom Project Cost (Deducted from Budget)
                    </label>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Optional</span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter cost to subtract from budget (e.g. 10000)"
                    value={paymentForm.customCost}
                    onChange={(e) => setPaymentForm(f => ({ ...f, customCost: e.target.value }))}
                    className={styles.inputField}
                    style={{
                      borderColor: Number(paymentForm.customCost) > 0 ? '#ef4444' : undefined,
                      color: Number(paymentForm.customCost) > 0 ? '#fca5a5' : '#f8fafc'
                    }}
                  />

                  {Number(paymentForm.customCost) > 0 && (
                    <input
                      type="text"
                      placeholder="Cost purpose / note (e.g. Server hosting, Subcontractor, Hardware)..."
                      value={paymentForm.costReason}
                      onChange={(e) => setPaymentForm(f => ({ ...f, costReason: e.target.value }))}
                      className={styles.inputField}
                      style={{ fontSize: '12px' }}
                    />
                  )}

                  <div style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '2px'
                  }}>
                    <span>Budget Impact:</span>
                    <span>
                      {formatCurrency(budget)} - {formatCurrency(Number(paymentForm.customCost) || 0)} = <strong style={{ color: '#38bdf8' }}>{formatCurrency(Math.max(0, budget - (Number(paymentForm.customCost) || 0)))}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                      Payment Method
                    </label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))}
                      className={styles.inputField}
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="bKash / Mobile Banking">bKash / Mobile Banking</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online Gateway">Online Gateway</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentForm.date}
                      onChange={(e) => setPaymentForm(f => ({ ...f, date: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Reference / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Milestone 1 deposit from client"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
                    className={styles.inputField}
                  />
                </div>

                {/* Live Distribution Preview */}
                {(Number(paymentForm.amount) > 0 || Number(paymentForm.customCost) > 0) && (
                  <div className={styles.previewBox}>
                    <span style={{ fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', fontSize: '11px' }}>
                      Automated Settlement Preview:
                    </span>
                    {Number(paymentForm.customCost) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fca5a5' }}>
                        <span>Budget Reduction (Custom Cost):</span>
                        <strong>-{formatCurrency(Number(paymentForm.customCost))}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Auto-Payout to Staff Dues:</span>
                      <strong style={{ color: '#f87171' }}>
                        {formatCurrency(Math.min(Number(paymentForm.amount) || 0, totalStaffDue))} (Logged to Expenses)
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Net Profit Retained:</span>
                      <strong style={{ color: '#34d399' }}>
                        {formatCurrency(Math.max(0, (Number(paymentForm.amount) || 0) - totalStaffDue))} (Logged to Incomes)
                      </strong>
                    </div>
                    {Number(paymentForm.amount) < totalStaffDue && (
                      <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px' }}>
                        ⚠ Payment is less than total staff dues ({formatCurrency(totalStaffDue)}). Unpaid dues will remain tracked as pending.
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddPaymentModalOpen(false)}
                    className={styles.backBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className={styles.submitBtn}
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' }}
                  >
                    {isSubmittingPayment ? 'Processing...' : 'Save & Distribute Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL: ASSIGN MULTIPLE COLLABORATORS (WITH PROJECT-BASED RATES)
            ==================================================================== */}
        {isAddMemberModalOpen && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsAddMemberModalOpen(false); }}>
            <div className={styles.modalContent} style={{ maxWidth: '580px' }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#c084fc' }}>group_add</span>
                  Assign Collaborators to Project
                </h3>
                <button onClick={() => setIsAddMemberModalOpen(false)} className={styles.closeBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Search & Filter Bar */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search employees by name or designation..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className={styles.inputField}
                    style={{ flex: 1 }}
                  />

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['ALL', 'PROJECT_BASED', 'SALARIED'] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setMemberFilter(f)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: memberFilter === f ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.1)',
                          background: memberFilter === f ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                          color: memberFilter === f ? '#c084fc' : '#94a3b8',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {f === 'ALL' ? 'All' : f === 'PROJECT_BASED' ? 'Project' : 'Salaried'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Multi-Select Employee List */}
                <div className={styles.multiEmployeeList}>
                  {employees
                    .filter(emp => {
                      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
                      const desig = (emp.designation || '').toLowerCase();
                      const matchesSearch = fullName.includes(memberSearch.toLowerCase()) || desig.includes(memberSearch.toLowerCase());
                      const isProj = emp.employmentType === 'Project-Based';
                      if (memberFilter === 'PROJECT_BASED') return matchesSearch && isProj;
                      if (memberFilter === 'SALARIED') return matchesSearch && !isProj;
                      return matchesSearch;
                    })
                    .map(emp => {
                      const cfg = selectedMemberConfigs[emp.id] || {
                        selected: false,
                        isProjectBased: emp.employmentType === 'Project-Based',
                        rate: emp.employmentType === 'Project-Based' ? String(emp.basicSalary || 0) : '0'
                      };

                      return (
                        <div
                          key={emp.id}
                          className={`${styles.multiEmployeeItem} ${cfg.selected ? styles.multiEmployeeItemActive : ''}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                              <input
                                type="checkbox"
                                checked={cfg.selected}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectedMemberConfigs(prev => ({
                                    ...prev,
                                    [emp.id]: {
                                      ...cfg,
                                      selected: checked
                                    }
                                  }));
                                }}
                                style={{ width: '16px', height: '16px', accentColor: '#a855f7', cursor: 'pointer' }}
                              />
                              <div className={styles.avatarBadge} style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                {emp.firstName[0]}{emp.lastName[0]}
                              </div>
                              <div>
                                <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px', display: 'block' }}>
                                  {emp.firstName} {emp.lastName}
                                </span>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                  {emp.designation || 'Staff'} {emp.email ? `• ${emp.email}` : ''}
                                </span>
                              </div>
                            </label>

                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: 700,
                              background: cfg.isProjectBased ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                              color: cfg.isProjectBased ? '#c084fc' : '#60a5fa',
                              border: cfg.isProjectBased ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'
                            }}>
                              {cfg.isProjectBased ? 'Project-Based' : 'Salaried'}
                            </span>
                          </div>

                          {/* If selected and Project-Based, allow setting project rate */}
                          {cfg.selected && (
                            <div style={{
                              marginTop: '6px',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: 'rgba(0,0,0,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              fontSize: '12px'
                            }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={cfg.isProjectBased}
                                  onChange={(e) => {
                                    const isPB = e.target.checked;
                                    setSelectedMemberConfigs(prev => ({
                                      ...prev,
                                      [emp.id]: {
                                        ...cfg,
                                        isProjectBased: isPB,
                                        rate: isPB && Number(cfg.rate) === 0 ? String(emp.basicSalary || 0) : cfg.rate
                                      }
                                    }));
                                  }}
                                  style={{ accentColor: '#a855f7' }}
                                />
                                <span style={{ color: '#cbd5e1' }}>Project-Based Compensation</span>
                              </label>

                              {cfg.isProjectBased && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>Agreed Fee (BDT):</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={cfg.rate}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSelectedMemberConfigs(prev => ({
                                        ...prev,
                                        [emp.id]: {
                                          ...cfg,
                                          rate: val
                                        }
                                      }));
                                    }}
                                    className={styles.inputField}
                                    style={{ width: '110px', padding: '4px 8px', fontSize: '12px', fontWeight: 600 }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Modal Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Selected: <strong>{Object.values(selectedMemberConfigs).filter(c => c.selected).length}</strong> collaborator(s)
                  </span>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddMemberModalOpen(false)}
                      className={styles.backBtn}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingMembers || Object.values(selectedMemberConfigs).filter(c => c.selected).length === 0}
                      onClick={handleSaveMultiMembers}
                      className={styles.submitBtn}
                    >
                      {isSubmittingMembers ? 'Saving...' : 'Assign Selected Members'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL: EDIT PROJECT PAYMENT
            ==================================================================== */}
        {isEditPaymentModalOpen && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsEditPaymentModalOpen(false); }}>
            <div className={styles.modalContent} style={{ maxWidth: '520px' }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#c084fc' }}>edit_note</span>
                  Edit Project Payment
                </h3>
                <button onClick={() => setIsEditPaymentModalOpen(false)} className={styles.closeBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>

              <form onSubmit={handleSaveEditPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Payment Amount (BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="e.g. 50000"
                    value={editPaymentForm.amount}
                    onChange={(e) => setEditPaymentForm(f => ({ ...f, amount: e.target.value }))}
                    className={styles.inputField}
                    style={{ fontSize: '16px', fontWeight: 700 }}
                  />
                </div>

                {/* Custom Cost Field */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.22)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>price_change</span>
                      Custom Project Cost (Deducted from Budget)
                    </label>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Optional</span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter cost (e.g. 5000)"
                    value={editPaymentForm.customCost}
                    onChange={(e) => setEditPaymentForm(f => ({ ...f, customCost: e.target.value }))}
                    className={styles.inputField}
                    style={{
                      borderColor: Number(editPaymentForm.customCost) > 0 ? '#ef4444' : undefined,
                      color: Number(editPaymentForm.customCost) > 0 ? '#fca5a5' : '#f8fafc'
                    }}
                  />

                  {Number(editPaymentForm.customCost) > 0 && (
                    <input
                      type="text"
                      placeholder="Cost reason / note (e.g. Hosting, Domain, Hardware)..."
                      value={editPaymentForm.costReason}
                      onChange={(e) => setEditPaymentForm(f => ({ ...f, costReason: e.target.value }))}
                      className={styles.inputField}
                      style={{ fontSize: '12px' }}
                    />
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                      Payment Method
                    </label>
                    <select
                      value={editPaymentForm.paymentMethod}
                      onChange={(e) => setEditPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))}
                      className={styles.inputField}
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="bKash / Mobile Banking">bKash / Mobile Banking</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online Gateway">Online Gateway</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={editPaymentForm.date}
                      onChange={(e) => setEditPaymentForm(f => ({ ...f, date: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Reference / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Milestone 1 payment adjustment"
                    value={editPaymentForm.notes}
                    onChange={(e) => setEditPaymentForm(f => ({ ...f, notes: e.target.value }))}
                    className={styles.inputField}
                  />
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  fontSize: '11px',
                  color: '#93c5fd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>info</span>
                  <span>Saving changes will automatically re-balance staff payouts, project custom costs, and company income records.</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditPaymentModalOpen(false)}
                    className={styles.backBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEditPayment}
                    className={styles.submitBtn}
                    style={{ background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)' }}
                  >
                    {isSubmittingEditPayment ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL: CONFIRM DELETE PAYMENT OR COST ITEM
            ==================================================================== */}
        {deleteItemConfirm && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setDeleteItemConfirm(null); }}>
            <div className={styles.modalContent} style={{ maxWidth: '440px' }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                  <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>warning</span>
                  Delete {deleteItemConfirm.type === 'payment' ? 'Payment' : 'Cost Record'}
                </h3>
                <button onClick={() => setDeleteItemConfirm(null)} className={styles.closeBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                  Are you sure you want to delete this {deleteItemConfirm.type === 'payment' ? 'payment transaction' : 'custom cost record'}?
                </p>

                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: '12px',
                  color: '#fca5a5'
                }}>
                  <strong style={{ display: 'block', color: '#f8fafc', marginBottom: '4px' }}>
                    {deleteItemConfirm.title}
                  </strong>
                  {deleteItemConfirm.type === 'payment' ? (
                    <span>Deleting this payment will revert staff payouts, custom cost deductions, and adjust company financial balances.</span>
                  ) : (
                    <span>Deleting this custom cost will restore the project cost balance and remove the corresponding ledger expense.</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setDeleteItemConfirm(null)}
                    className={styles.backBtn}
                    disabled={isDeletingItem}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteDeleteItem}
                    disabled={isDeletingItem}
                    className={styles.submitBtn}
                    style={{ background: '#ef4444', borderColor: '#ef4444' }}
                  >
                    {isDeletingItem ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL: CONFIRM DELETE PROJECT
            ==================================================================== */}
        {isDeleteProjectModalOpen && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsDeleteProjectModalOpen(false); }}>
            <div className={styles.modalContent} style={{ maxWidth: '460px' }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                  <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>delete_forever</span>
                  Delete Project
                </h3>
                <button onClick={() => setIsDeleteProjectModalOpen(false)} className={styles.closeBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                  Are you sure you want to permanently delete project <strong style={{ color: '#f8fafc' }}>{project?.name}</strong>?
                </p>

                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: '12px',
                  color: '#fca5a5',
                  lineHeight: '1.4'
                }}>
                  <strong style={{ display: 'block', color: '#ef4444', marginBottom: '4px' }}>
                    Warning: This action is irreversible!
                  </strong>
                  All associated project tasks, milestones, payment records, member rate assignments, and project history will be permanently deleted.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setIsDeleteProjectModalOpen(false)}
                    className={styles.backBtn}
                    disabled={isDeletingProject}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    disabled={isDeletingProject}
                    className={styles.submitBtn}
                    style={{ background: '#dc2626', borderColor: '#dc2626' }}
                  >
                    {isDeletingProject ? 'Deleting Project...' : 'Permanently Delete Project'}
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
