"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function ProjectWorkspacePage({ params }: { params?: Promise<{ id: string }> }) {
  const routeParams = useParams();
  const projectId = (routeParams?.id as string) || '';
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<{ status: number; message: string } | null>(null);

  // 7-Stage Workflow State
  const DEFAULT_STAGE_NAMES: Record<number, string> = {
    1: "Draft",
    2: "Advance Received",
    3: "Product Received",
    4: "Shooting",
    5: "Editing",
    6: "Demo",
    7: "Complete"
  };

  const [currentStage, setCurrentStage] = useState<number>(1);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [stageNames, setStageNames] = useState<Record<number, string>>(DEFAULT_STAGE_NAMES);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [customStageNames, setCustomStageNames] = useState<Record<number, string>>(DEFAULT_STAGE_NAMES);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementOption, setSettlementOption] = useState<'FULL' | 'PARTIAL' | 'PAY_LATER'>('FULL');
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementMethod, setSettlementMethod] = useState('Bank Transfer');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [isCustomerLinked, setIsCustomerLinked] = useState(false);

  // Stage 3 Product & Shoot Schedule & Model Assign State
  const [productData, setProductData] = useState({
    received: true,
    productName: '',
    quantity: '',
    category: '',
    condition: 'Good',
    notes: '',
    shootingDate: '',
    shootingTime: '',
    studioLocation: 'Studio Main Floor',
    assignedModelId: '',
    assignedModelName: '',
    modelRate: '',
    modelNotes: ''
  });

  // Stage 4 Shooting State
  const [shootingData, setShootingData] = useState({
    status: 'Scheduled', // 'Scheduled' | 'In Progress' | 'Wrapped'
    shootingNotes: '',
    rawFootageUrl: '',
    assignedEditorId: '',
    assignedEditorName: '',
    editorInstructions: '',
    expectedEditDelivery: ''
  });

  // Stage 5 Editing State
  const [editingData, setEditingData] = useState({
    status: 'In Progress', // 'Ingesting' | 'Rough Cut' | 'Color Grading' | 'Review Ready'
    editorNotes: '',
    deliverableSpecs: '1080x1920 (9:16) & 16:9 4K Master',
    workingFileUrl: '',
    checklist: {
      audioCleaned: false,
      colorGraded: false,
      logoWatermarked: false,
      subtitlesAdded: false
    }
  });

  // Stage 6 Demo & Revision State
  const [demoData, setDemoData] = useState({
    demoFiles: [] as { id: string; name: string; url: string; date: string }[],
    newDemoName: '',
    newDemoUrl: '',
    revisionCount: 0,
    revisionNotes: '',
    approvalStatus: 'Pending Review' // 'Pending Review' | 'Revision Requested' | 'Approved'
  });

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
    clientPhone: '',
    category: '',
    priority: 'Medium',
    status: 'Draft',
    progress: '0',
    managerId: '',
    startDate: '',
    endDate: '',
    expectedShootingDate: '',
    expectedEditingDate: '',
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
    if (!projectId) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (res.ok && data?.project) {
        setProject(data.project);
        setEditForm({
          name: data.project.name || '',
          projectCode: data.project.projectCode || '',
          clientName: data.project.clientName || '',
          clientPhone: data.project.clientPhone || '',
          category: data.project.category || '',
          priority: data.project.priority || 'Medium',
          status: data.project.status || 'Draft',
          progress: data.project.progress !== undefined && data.project.progress !== null ? String(data.project.progress) : '0',
          managerId: data.project.managerId || '',
          startDate: data.project.startDate ? data.project.startDate.split('T')[0] : '',
          endDate: data.project.endDate ? data.project.endDate.split('T')[0] : '',
          expectedShootingDate: data.project.expectedShootingDate ? data.project.expectedShootingDate.split('T')[0] : '',
          expectedEditingDate: data.project.expectedEditingDate ? data.project.expectedEditingDate.split('T')[0] : '',
          estimatedBudget: data.project.estimatedBudget ? String(data.project.estimatedBudget) : '',
          actualCost: data.project.actualCost ? String(data.project.actualCost) : '',
          description: data.project.description || ''
        });

        // Parse Workflow Metadata from Description if present
        if (data.project.description) {
          const match = data.project.description.match(/\[\[WORKFLOW_META_V1:([\s\S]*?)\]\]/);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]);
              if (parsed.currentStage) setCurrentStage(parsed.currentStage);
              if (parsed.completedStages) setCompletedStages(parsed.completedStages);
              if (parsed.stageNames) {
                setStageNames(parsed.stageNames);
                setCustomStageNames(parsed.stageNames);
              }
              if (parsed.productData) setProductData(prev => ({ ...prev, ...parsed.productData }));
              if (parsed.shootingData) setShootingData(prev => ({ ...prev, ...parsed.shootingData }));
              if (parsed.editingData) setEditingData(prev => ({ ...prev, ...parsed.editingData }));
              if (parsed.demoData) setDemoData(prev => ({ ...prev, ...parsed.demoData }));
            } catch (e) {
              console.error("Failed to parse workflow meta:", e);
            }
          } else {
            // Initial stage inference from project status
            if (data.project.status === 'Completed') {
              setCurrentStage(7);
              setCompletedStages([1, 2, 3, 4, 5, 6, 7]);
            } else if (data.project.status === 'Active') {
              setCurrentStage(2);
              setCompletedStages([1]);
            } else {
              setCurrentStage(1);
              setCompletedStages([]);
            }
          }
        }
      } else {
        setApiError({ status: res.status, message: data?.error || data?.message || `HTTP ${res.status}` });
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
      const payload: any = { status: newStatus };
      if (newStatus === 'Completed') {
        payload.progress = 100;
      }
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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

  const saveWorkflowState = async (
    targetStage?: number,
    targetCompleted?: number[],
    customData?: {
      product?: typeof productData;
      shooting?: typeof shootingData;
      editing?: typeof editingData;
      demo?: typeof demoData;
      names?: typeof stageNames;
    },
    extraProjectPayload?: any
  ) => {
    try {
      const stageToPersist = targetStage ?? currentStage;
      const completedToPersist = targetCompleted ?? completedStages;
      const namesToPersist = customData?.names ?? stageNames;
      const productToPersist = customData?.product ?? productData;
      const shootingToPersist = customData?.shooting ?? shootingData;
      const editingToPersist = customData?.editing ?? editingData;
      const demoToPersist = customData?.demo ?? demoData;

      const workflowMeta = {
        currentStage: stageToPersist,
        completedStages: completedToPersist,
        stageNames: namesToPersist,
        productData: productToPersist,
        shootingData: shootingToPersist,
        editingData: editingToPersist,
        demoData: demoToPersist
      };

      const payload: any = {
        progress: Math.min(100, Math.round((stageToPersist / 7) * 100)),
        ...extraProjectPayload
      };

      if (stageToPersist === 7) {
        payload.status = 'Completed';
        payload.progress = 100;
      } else if (stageToPersist > 1 && project?.status === 'Draft') {
        payload.status = 'Active';
      }

      let baseDesc = project?.description || '';
      const metaTagRegex = /\[\[WORKFLOW_META_V1:[\s\S]*?\]\]/;
      const metaString = `[[WORKFLOW_META_V1:${JSON.stringify(workflowMeta)}]]`;
      if (metaTagRegex.test(baseDesc)) {
        baseDesc = baseDesc.replace(metaTagRegex, metaString);
      } else {
        baseDesc = baseDesc ? `${baseDesc}\n\n${metaString}` : metaString;
      }
      payload.description = baseDesc;

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchProject();
      }
    } catch (e) {
      console.error("Failed to save workflow state:", e);
    }
  };

  const handleAdvanceStage = async (nextStage: number) => {
    const updatedCompleted = Array.from(new Set([...completedStages, currentStage]));
    setCompletedStages(updatedCompleted);
    setCurrentStage(nextStage);
    showToast(`Advanced to Stage ${nextStage}: ${stageNames[nextStage] || ''}`);
    await saveWorkflowState(nextStage, updatedCompleted);
  };

  const handleSaveCustomStageNames = async (e: React.FormEvent) => {
    e.preventDefault();
    setStageNames(customStageNames);
    setIsSettingsModalOpen(false);
    showToast("Stage workflow names updated");
    await saveWorkflowState(currentStage, completedStages, { names: customStageNames });
  };

  const handleLinkCustomer = () => {
    setIsCustomerLinked(true);
    showToast(`🎉 Project linked to Customer: ${project?.clientName || 'Client'}`);
  };

  const handleExecuteSettlement = async () => {
    setIsSubmittingPayment(true);
    try {
      if (settlementOption === 'FULL' && clientDue > 0) {
        await fetch(`/api/projects/${projectId}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: clientDue,
            paymentMethod: settlementMethod,
            notes: settlementNotes.trim() ? `[Full Settlement] ${settlementNotes.trim()}` : `[Full Settlement] Final payment collected at project completion.`,
            date: new Date().toISOString().split('T')[0]
          })
        });
      } else if (settlementOption === 'PARTIAL' && Number(settlementAmount) > 0) {
        await fetch(`/api/projects/${projectId}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(settlementAmount),
            paymentMethod: settlementMethod,
            notes: settlementNotes.trim() ? `[Partial Settlement] ${settlementNotes.trim()}` : `[Partial Settlement] Partial payment recorded at completion.`,
            date: new Date().toISOString().split('T')[0]
          })
        });
      }

      setIsSettlementModalOpen(false);
      const updatedCompleted = Array.from(new Set([...completedStages, 1, 2, 3, 4, 5, 6, 7]));
      setCompletedStages(updatedCompleted);
      setCurrentStage(7);
      showToast("🎉 Project Completed Successfully!");
      await saveWorkflowState(7, updatedCompleted, undefined, { status: 'Completed', progress: 100 });
    } catch (err) {
      console.error(err);
      showToast("Error processing completion settlement");
    } finally {
      setIsSubmittingPayment(false);
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
          clientPhone: editForm.clientPhone.trim() || null,
          category: editForm.category.trim() || null,
          priority: editForm.priority,
          status: editForm.status,
          progress: editForm.progress !== '' ? Math.min(100, Math.max(0, Number(editForm.progress))) : 0,
          managerId: editForm.managerId || null,
          startDate: editForm.startDate || null,
          endDate: editForm.endDate || null,
          expectedShootingDate: editForm.expectedShootingDate || null,
          expectedEditingDate: editForm.expectedEditingDate || null,
          estimatedBudget: editForm.estimatedBudget ? Number(editForm.estimatedBudget) : null,
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
  const taskProgress = project.status === 'Completed' ? 100 : (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress || 0);

  // Project Financials & Collections Computations
  const payments = project.payments || [];
  const projectEmployees = project.projectEmployees || [];
  const totalReceived = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const clientDue = Math.max(0, budget - totalReceived);

  // Realized Cash Profit / Loss (Collected from client - Total Cost)
  const realizedProfit = totalReceived - actualCost;
  const isLoss = realizedProfit < 0;
  const lossAmount = isLoss ? Math.abs(realizedProfit) : 0;

  // Projected Original Profit upon full collection of contract budget
  const projectedProfit = budget - actualCost;
  const isProjectedLoss = projectedProfit < 0;

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
                    borderColor: project.status === 'Completed' ? 'rgba(16, 185, 129, 0.6)' : project.status === 'Active' ? 'rgba(59, 130, 246, 0.4)' : undefined,
                    color: project.status === 'Completed' ? '#34d399' : project.status === 'Active' ? '#60a5fa' : undefined,
                    fontWeight: 700
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
                className={styles.deleteProjectBtn}
                title="Delete Project"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                Delete
              </button>
            </div>
          </div>

          <div className={styles.headerBody}>
            <div className={styles.headerLeft}>
              <div className={styles.projectCodeBadge}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>tag</span>
                {project.projectCode || 'PROJECT-ALPHA'}
              </div>
              <h1 className={styles.projectTitle}>{project.name}</h1>
              <div className={styles.projectMetaRow}>
                <span className={styles.metaItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#60a5fa' }}>business</span>
                  Client: <strong>{project.clientName || 'Internal Client'}</strong>
                  {project.clientPhone && (
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#60a5fa' }}>call</span>
                      {project.clientPhone}
                    </span>
                  )}
                </span>

                <span className={styles.metaItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#a855f7' }}>badge</span>
                  Manager: <strong>{project.manager ? `${project.manager.firstName || ''} ${project.manager.lastName || ''}`.trim() || 'Unassigned' : 'Unassigned'}</strong>
                </span>

                <span className={styles.metaItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#f59e0b' }}>flag</span>
                  Priority: <strong style={{
                    color: project.priority === 'Urgent' ? '#f87171' : project.priority === 'High' ? '#fbbf24' : '#f8fafc'
                  }}>{project.priority || 'Medium'}</strong>
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
          {/* Card 1: Estimated Budget & Collections */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIconBox} style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa' }}>
                <span className="material-symbols-outlined">payments</span>
              </div>
              <span className={styles.kpiBadge} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                {budget > 0 ? `${Math.round((totalReceived / budget) * 100)}% Paid` : 'Target'}
              </span>
            </div>
            <div>
              <span className={styles.kpiLabel}>Contract Budget</span>
              <div className={styles.kpiMainValue}>
                {formatCurrency(budget)}
              </div>
            </div>
            <div className={styles.kpiFooter}>
              <span>Collected: <strong style={{ color: '#34d399' }}>{formatCurrency(totalReceived)}</strong></span>
              <span>Due: <strong style={{ color: clientDue > 0 ? '#f87171' : '#34d399' }}>{formatCurrency(clientDue)}</strong></span>
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
                {burnRate}% Cost Ratio
              </span>
            </div>
            <div>
              <span className={styles.kpiLabel}>Total Recorded Costs</span>
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
              <span>{expenses.length} Expense Item(s) Recorded</span>
              <span>Deducts from profit</span>
            </div>
          </div>

          {/* Card 3: Realized Cash Profit / Loss */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIconBox} style={{
                background: isLoss ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: isLoss ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                color: isLoss ? '#f87171' : '#34d399'
              }}>
                <span className="material-symbols-outlined">{isLoss ? 'trending_down' : 'trending_up'}</span>
              </div>
              <span className={styles.kpiBadge} style={{
                background: isLoss ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                color: isLoss ? '#f87171' : '#34d399'
              }}>
                {isLoss ? '🔴 Current Loss' : '🟢 Realized Profit'}
              </span>
            </div>
            <div>
              <span className={styles.kpiLabel}>Current Cash Position</span>
              <div className={styles.kpiMainValue} style={{ color: isLoss ? '#f87171' : '#34d399' }}>
                {isLoss ? `-${formatCurrency(lossAmount)}` : `+${formatCurrency(realizedProfit)}`}
              </div>
            </div>
            <div className={styles.kpiFooter}>
              <span>Projected: <strong style={{ color: isProjectedLoss ? '#f87171' : '#38bdf8' }}>{isProjectedLoss ? '-' : '+'}{formatCurrency(Math.abs(projectedProfit))}</strong></span>
              <span>{clientDue === 0 ? 'Fully Collected' : 'On Full Pay'}</span>
            </div>
          </div>

          {/* Card 4: Milestone Velocity & Progress */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIconBox} style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc' }}>
                <span className="material-symbols-outlined">donut_large</span>
              </div>
              <span className={styles.kpiBadge} style={{
                background: project.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                color: project.status === 'Completed' ? '#34d399' : '#c084fc'
              }}>
                {project.status || 'Draft'}
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
              <span>{taskProgress === 100 ? 'Completed' : 'In Progress'}</span>
            </div>
          </div>
        </div>

        {/* 3. Interactive 7-Stage Progressive Breadcrumb Pipeline Navigation */}
        <div className={styles.breadcrumbPipelineWrapper}>
          <div className={styles.breadcrumbHeader}>
            <div className={styles.breadcrumbHeaderLeft}>
              <span className="material-symbols-outlined" style={{ color: '#c084fc', fontSize: '20px' }}>
                linear_scale
              </span>
              <div>
                <h3 className={styles.breadcrumbMainTitle}>Project Execution Workflow</h3>
                <span className={styles.breadcrumbSubTitle}>
                  Progressive milestone pipeline • Click unlocked steps or proceed upon completion
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCustomStageNames({ ...stageNames });
                setIsSettingsModalOpen(true);
              }}
              className={styles.workflowSettingsBtn}
              title="Edit workflow stage names & settings"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
              Workflow Settings
            </button>
          </div>

          <div className={styles.breadcrumbPipeline}>
            {[1, 2, 3, 4, 5, 6, 7].map((sIndex, idx) => {
              const isActive = currentStage === sIndex;
              const isCompleted = completedStages.includes(sIndex);
              const maxCompleted = completedStages.length > 0 ? Math.max(...completedStages) : 0;
              const isAccessible = isCompleted || isActive || sIndex <= maxCompleted + 1;

              return (
                <React.Fragment key={sIndex}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isAccessible) {
                        setCurrentStage(sIndex);
                      } else {
                        showToast(`Please finish Stage ${sIndex - 1} before proceeding to Stage ${sIndex}.`, 'warning');
                      }
                    }}
                    className={`${styles.breadcrumbStep} ${
                      isActive
                        ? styles.breadcrumbStepActive
                        : isCompleted
                        ? styles.breadcrumbStepCompleted
                        : isAccessible
                        ? ''
                        : styles.breadcrumbStepLocked
                    }`}
                    title={
                      isAccessible
                        ? `Switch to Stage ${sIndex}: ${stageNames[sIndex] || `Stage ${sIndex}`}`
                        : `Complete previous stages to unlock Stage ${sIndex}`
                    }
                  >
                    <span className={styles.stepNumBadge}>
                      {isCompleted ? (
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span>
                      ) : (
                        sIndex
                      )}
                    </span>
                    <span className={styles.stepTitle}>
                      {stageNames[sIndex] || DEFAULT_STAGE_NAMES[sIndex]}
                    </span>
                  </button>

                  {idx < 6 && (
                    <span className={`material-symbols-outlined ${styles.stepChevron}`}>
                      chevron_right
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ====================================================================
            4. DYNAMIC STAGE DASHBOARDS (STAGES 1 TO 7)
            ==================================================================== */}
        <div className={styles.stageContainer}>
          {/* ------------------------------------------------------------------
              STAGE 1: DRAFT (Project Details & Setup)
              ------------------------------------------------------------------ */}
          {currentStage === 1 && (
            <>
              <div className={styles.stageBanner}>
                <div className={styles.stageBannerLeft}>
                  <div className={styles.stageBadgeIcon} style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>description</span>
                  </div>
                  <div>
                    <h2 className={styles.stageTitle}>Stage 1: {stageNames[1] || 'Draft'} (Project Details)</h2>
                    <p className={styles.stageSubTitle}>
                      Configure core project specifications, kickoff schedules, and initial team setup.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className={styles.editBtn}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                  Edit Project Info
                </button>
              </div>

              <div className={styles.stageGrid2}>
                {/* Left Card: Core Specifications */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#c084fc' }}>badge</span>
                      Project Identification & Parameters
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Project Title</span>
                      <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{project.name}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Project Identifier</span>
                      <span className={styles.projectCodeBadge}>{project.projectCode || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Client / Account</span>
                      <strong style={{ fontSize: '13px', color: '#60a5fa' }}>
                        {project.clientName || 'General Client'}
                        {project.clientPhone ? ` (${project.clientPhone})` : ''}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Project Manager / Lead</span>
                      <span style={{ fontSize: '13px', color: '#f8fafc' }}>
                        {project.manager ? `${project.manager.firstName || ''} ${project.manager.lastName || ''}`.trim() : 'Unassigned'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Contract Budget</span>
                      <strong style={{ fontSize: '14px', color: '#34d399' }}>{formatCurrency(budget)}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: (project.expectedShootingDate || project.expectedEditingDate) ? '8px' : '0', borderBottom: (project.expectedShootingDate || project.expectedEditingDate) ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Schedule Window</span>
                      <span style={{ fontSize: '12px', color: '#fbbf24' }}>
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not Set'} &rarr; {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Open-Ended'}
                      </span>
                    </div>

                    {(project.expectedShootingDate || project.expectedEditingDate) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '2px' }}>
                        {project.expectedShootingDate && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#38bdf8' }}>photo_camera</span>
                              Shooting Date
                            </span>
                            <strong style={{ fontSize: '12px', color: '#f8fafc' }}>
                              {new Date(project.expectedShootingDate).toLocaleDateString()}
                            </strong>
                          </div>
                        )}
                        {project.expectedEditingDate && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#c084fc' }}>movie_edit</span>
                              Editing Date
                            </span>
                            <strong style={{ fontSize: '12px', color: '#f8fafc' }}>
                              {new Date(project.expectedEditingDate).toLocaleDateString()}
                            </strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Card: Scope & Objectives */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#60a5fa' }}>assignment</span>
                      Scope Narrative & Deliverable Brief
                    </h3>
                  </div>

                  <div className={styles.descriptionBox}>
                    {(project.description || '').replace(/\[\[WORKFLOW_META_V1:[\s\S]*?\]\]/, '').trim() || "No scope narrative documented yet. Click 'Edit Project Info' to configure deliverables."}
                  </div>

                  <div className={styles.successBox}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
                    <span>Draft is created. Review specifications and proceed to Advance Payment recording.</span>
                  </div>
                </div>
              </div>

              <div className={styles.stageBottomActions}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Next step: Record and verify client advance payment
                </span>
                <button
                  type="button"
                  onClick={() => handleAdvanceStage(2)}
                  className={styles.advanceBtn}
                >
                  Confirm Draft & Proceed to Stage 2: {stageNames[2] || 'Advance Received'} &rarr;
                </button>
              </div>
            </>
          )}

          {/* ------------------------------------------------------------------
              STAGE 2: ADVANCE RECEIVED (Financials & Payment Method)
              ------------------------------------------------------------------ */}
          {currentStage === 2 && (
            <>
              <div className={styles.stageBanner}>
                <div className={styles.stageBannerLeft}>
                  <div className={styles.stageBadgeIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>payments</span>
                  </div>
                  <div>
                    <h2 className={styles.stageTitle}>Stage 2: {stageNames[2] || 'Advance Received'} (Financial Settlement)</h2>
                    <p className={styles.stageSubTitle}>
                      Record advance payment receipts, track client ledger accounts, and audit receivables.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPaymentModalOpen(true)}
                  className={styles.advanceBtn}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                  + Record Payment
                </button>
              </div>

              {/* Financial KPI Summary */}
              <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Total Contract Budget</span>
                  <div className={styles.kpiMainValue}>{formatCurrency(budget)}</div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Agreed project valuation</span>
                </div>

                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Advance & Collected Amount</span>
                  <div className={styles.kpiMainValue} style={{ color: '#34d399' }}>{formatCurrency(totalReceived)}</div>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                    {budget > 0 ? `${Math.round((totalReceived / budget) * 100)}% Collected` : 'Received'}
                  </span>
                </div>

                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Remaining Client Due</span>
                  <div className={styles.kpiMainValue} style={{ color: clientDue > 0 ? '#f87171' : '#34d399' }}>{formatCurrency(clientDue)}</div>
                  <span style={{ fontSize: '11px', color: clientDue === 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                    {clientDue === 0 ? '✓ Fully Settled' : 'Payment Balance Due'}
                  </span>
                </div>
              </div>

              <div className={styles.stageGrid2}>
                {/* Left Card: Quick Record Advance Payment Form */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#34d399' }}>add_card</span>
                      Record Client Advance Payment
                    </h3>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) return;
                    setIsSubmittingPayment(true);
                    try {
                      const res = await fetch(`/api/projects/${projectId}/payments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          amount: Number(paymentForm.amount),
                          paymentMethod: paymentForm.paymentMethod,
                          notes: paymentForm.notes ? `[Advance] ${paymentForm.notes}` : '[Advance Payment]',
                          date: paymentForm.date
                        })
                      });
                      if (res.ok) {
                        showToast("Advance payment recorded successfully!");
                        setPaymentForm({
                          amount: '',
                          customCost: '',
                          costReason: '',
                          paymentMethod: 'Bank Transfer',
                          notes: '',
                          date: new Date().toISOString().split('T')[0]
                        });
                        fetchProject();
                      }
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsSubmittingPayment(false);
                    }
                  }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className={styles.stageField}>
                      <label>Advance Payment Amount (BDT) *</label>
                      <div className={styles.stageInputWrapper}>
                        <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>payments</span>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 50,000"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                          className={styles.stageInput}
                        />
                      </div>
                    </div>

                    <div className={styles.stageField}>
                      <label>Payment Channel / Method *</label>
                      <div className={styles.stageInputWrapper}>
                        <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>account_balance</span>
                        <select
                          value={paymentForm.paymentMethod}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                          className={styles.stageSelect}
                        >
                          <option value="Bank Transfer">Bank Transfer (Direct AC)</option>
                          <option value="bKash Merchant">bKash (Merchant / Personal)</option>
                          <option value="Nagad">Nagad Wallet</option>
                          <option value="Cash">Cash in Hand</option>
                          <option value="Rocket">Rocket Mobile Banking</option>
                          <option value="Card / POS">Credit / Debit Card (POS)</option>
                          <option value="Cheque">Bank Cheque</option>
                        </select>
                        <span className={`material-symbols-outlined ${styles.statusSelectChevron}`}>expand_more</span>
                      </div>
                    </div>

                    <div className={styles.stageField}>
                      <label>Payment Date</label>
                      <div className={styles.stageInputWrapper}>
                        <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>calendar_today</span>
                        <input
                          type="date"
                          value={paymentForm.date}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                          className={styles.stageInput}
                        />
                      </div>
                    </div>

                    <div className={styles.stageField}>
                      <label>Transaction Memo / Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. 50% Advance received for styling & production"
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                        className={styles.stageInput}
                        style={{ paddingLeft: '14px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      className={styles.advanceBtn}
                      style={{ marginTop: '6px', justifyContent: 'center' }}
                    >
                      {isSubmittingPayment ? 'Recording...' : 'Record Payment Receipt'}
                    </button>
                  </form>
                </div>

                {/* Right Card: Payment Ledger History */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>receipt_long</span>
                      Received Payments Ledger ({payments.length})
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                    {payments.length > 0 ? (
                      payments.map((p: any) => (
                        <div key={p.id} className={styles.paymentHistoryItem}>
                          <div className={styles.paymentItemLeft}>
                            <div className={styles.paymentItemIcon}>
                              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#34d399' }}>
                                check_circle
                              </span>
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ fontSize: '13px', color: '#f8fafc' }}>
                                  {formatCurrency(p.amount)}
                                </strong>
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                                  {p.paymentMethod || 'Bank'}
                                </span>
                              </div>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {p.notes || 'Project Payment'} • {new Date(p.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                        No payments recorded yet. Enter advance payment above to get started.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.stageBottomActions}>
                <button
                  type="button"
                  onClick={() => setCurrentStage(1)}
                  className={styles.stageBackBtn}
                >
                  &larr; Back to Stage 1
                </button>
                <button
                  type="button"
                  onClick={() => handleAdvanceStage(3)}
                  className={styles.advanceBtn}
                >
                  Confirm Advance & Proceed to Stage 3: {stageNames[3] || 'Product Received'} &rarr;
                </button>
              </div>
            </>
          )}

          {/* ------------------------------------------------------------------
              STAGE 3: PRODUCT RECEIVED (Product Details, Shoot Schedule & Model Assignment)
              ------------------------------------------------------------------ */}
          {currentStage === 3 && (
            <>
              <div className={styles.stageBanner}>
                <div className={styles.stageBannerLeft}>
                  <div className={styles.stageBadgeIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>inventory_2</span>
                  </div>
                  <div>
                    <h2 className={styles.stageTitle}>Stage 3: {stageNames[3] || 'Product Received'} (Inventory & Scheduling)</h2>
                    <p className={styles.stageSubTitle}>
                      Verify received products, schedule shooting date & time, and dynamically assign model talent.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: productData.received ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                    {productData.received ? '✓ Products Verified' : 'Pending Receipt'}
                  </span>
                </div>
              </div>

              <div className={styles.stageGrid2}>
                {/* Left Card: Product Received Details */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>package_2</span>
                      Product Intake & Inspection
                    </h3>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#cbd5e1' }}>
                      <input
                        type="checkbox"
                        checked={productData.received}
                        onChange={(e) => {
                          const updated = { ...productData, received: e.target.checked };
                          setProductData(updated);
                          saveWorkflowState(currentStage, completedStages, { product: updated });
                        }}
                        style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                      />
                      Mark Received
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className={styles.stageField}>
                      <label>Product / Collection Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Winter Denim & Leather Collection"
                        value={productData.productName}
                        onChange={(e) => {
                          const updated = { ...productData, productName: e.target.value };
                          setProductData(updated);
                        }}
                        className={styles.stageInput}
                        style={{ paddingLeft: '14px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className={styles.stageField}>
                        <label>Quantity / SKU Count</label>
                        <input
                          type="text"
                          placeholder="e.g. 15 Outfits"
                          value={productData.quantity}
                          onChange={(e) => {
                            const updated = { ...productData, quantity: e.target.value };
                            setProductData(updated);
                          }}
                          className={styles.stageInput}
                          style={{ paddingLeft: '14px' }}
                        />
                      </div>

                      <div className={styles.stageField}>
                        <label>Condition Assessment</label>
                        <select
                          value={productData.condition}
                          onChange={(e) => {
                            const updated = { ...productData, condition: e.target.value };
                            setProductData(updated);
                          }}
                          className={styles.stageSelect}
                          style={{ paddingLeft: '14px' }}
                        >
                          <option value="Good">Good / Ready for Shoot</option>
                          <option value="Steam Ironing Required">Steam Ironing Required</option>
                          <option value="Fragile / Handle With Care">Fragile / Handle with Care</option>
                          <option value="Sample Prototype">Sample Prototype</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.stageField}>
                      <label>Intake Notes & Instructions</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. 10 jackets, 5 hoodies. Return hanger bags after shoot."
                        value={productData.notes}
                        onChange={(e) => {
                          const updated = { ...productData, notes: e.target.value };
                          setProductData(updated);
                        }}
                        className={styles.stageTextarea}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Card: Shoot Schedule & Model Assignment */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#f472b6' }}>photo_camera</span>
                      Shooting Schedule & Model Talent
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className={styles.stageField}>
                        <label>Shooting Date *</label>
                        <div className={styles.stageInputWrapper}>
                          <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>calendar_today</span>
                          <input
                            type="date"
                            value={productData.shootingDate}
                            onChange={(e) => {
                              const updated = { ...productData, shootingDate: e.target.value };
                              setProductData(updated);
                              saveWorkflowState(currentStage, completedStages, { product: updated });
                            }}
                            className={styles.stageInput}
                          />
                        </div>
                      </div>

                      <div className={styles.stageField}>
                        <label>Shooting Time Window *</label>
                        <div className={styles.stageInputWrapper}>
                          <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>schedule</span>
                          <input
                            type="text"
                            placeholder="e.g. 10:00 AM - 04:00 PM"
                            value={productData.shootingTime}
                            onChange={(e) => {
                              const updated = { ...productData, shootingTime: e.target.value };
                              setProductData(updated);
                              saveWorkflowState(currentStage, completedStages, { product: updated });
                            }}
                            className={styles.stageInput}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.stageField}>
                      <label>Studio Location / Floor</label>
                      <input
                        type="text"
                        placeholder="e.g. Main Cyclorama Studio Room A"
                        value={productData.studioLocation}
                        onChange={(e) => {
                          const updated = { ...productData, studioLocation: e.target.value };
                          setProductData(updated);
                        }}
                        className={styles.stageInput}
                        style={{ paddingLeft: '14px' }}
                      />
                    </div>

                    {/* Dynamic Model Assignment */}
                    <div className={styles.stageField} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Model Assignment (Dynamic & Changeable)</label>
                        <span style={{ fontSize: '10px', color: '#f472b6', fontWeight: 600 }}>Talent System</span>
                      </div>
                      <div className={styles.stageInputWrapper}>
                        <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>face</span>
                        <input
                          type="text"
                          placeholder="e.g. Sarah Miller - Elite Agency (or select/enter talent)"
                          value={productData.assignedModelName}
                          onChange={(e) => {
                            const updated = { ...productData, assignedModelName: e.target.value };
                            setProductData(updated);
                          }}
                          className={styles.stageInput}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className={styles.stageField}>
                        <label>Model Rate / Pay (BDT)</label>
                        <input
                          type="number"
                          placeholder="e.g. 15,000"
                          value={productData.modelRate}
                          onChange={(e) => {
                            const updated = { ...productData, modelRate: e.target.value };
                            setProductData(updated);
                          }}
                          className={styles.stageInput}
                          style={{ paddingLeft: '14px' }}
                        />
                      </div>

                      <div className={styles.stageField}>
                        <label>Wardrobe / Look Specs</label>
                        <input
                          type="text"
                          placeholder="e.g. 4 looks, natural makeup"
                          value={productData.modelNotes}
                          onChange={(e) => {
                            const updated = { ...productData, modelNotes: e.target.value };
                            setProductData(updated);
                          }}
                          className={styles.stageInput}
                          style={{ paddingLeft: '14px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.stageBottomActions}>
                <button
                  type="button"
                  onClick={() => setCurrentStage(2)}
                  className={styles.stageBackBtn}
                >
                  &larr; Back to Stage 2
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveWorkflowState(4, Array.from(new Set([...completedStages, 3])), { product: productData });
                    handleAdvanceStage(4);
                  }}
                  className={styles.advanceBtn}
                >
                  Confirm Schedule & Proceed to Stage 4: {stageNames[4] || 'Shooting'} &rarr;
                </button>
              </div>
            </>
          )}

          {/* ------------------------------------------------------------------
              STAGE 4: SHOOTING (Execution, Warning Check, Notes & Editor Assign)
              ------------------------------------------------------------------ */}
          {currentStage === 4 && (
            <>
              <div className={styles.stageBanner}>
                <div className={styles.stageBannerLeft}>
                  <div className={styles.stageBadgeIcon} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>videocam</span>
                  </div>
                  <div>
                    <h2 className={styles.stageTitle}>Stage 4: {stageNames[4] || 'Shooting'} (Production Execution)</h2>
                    <p className={styles.stageSubTitle}>
                      Track live shoot status, log shooting notes & raw assets, and assign post-production editor.
                    </p>
                  </div>
                </div>
                <div className={styles.statusSelectWrapper}>
                  <select
                    value={shootingData.status}
                    onChange={(e) => {
                      const updated = { ...shootingData, status: e.target.value };
                      setShootingData(updated);
                      saveWorkflowState(currentStage, completedStages, { shooting: updated });
                    }}
                    className={styles.stageSelect}
                    style={{ paddingLeft: '14px', borderColor: shootingData.status === 'Wrapped' ? '#10b981' : undefined }}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress (Rolling)</option>
                    <option value="Wrapped">Wrapped / Complete</option>
                  </select>
                </div>
              </div>

              {/* WARNING BANNER: If Shooting Date/Time was not selected in Stage 3 */}
              {(!productData.shootingDate || !productData.shootingTime) && (
                <div className={styles.warningAlert}>
                  <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '24px', flexShrink: 0 }}>
                    warning
                  </span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <strong>Shooting Date & Time Not Scheduled in Step 3!</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#fef3c7' }}>
                        The shoot schedule was left unassigned in Stage 3 (Product Received). Please specify the shoot date and time below:
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                      <input
                        type="date"
                        value={productData.shootingDate}
                        onChange={(e) => {
                          const updated = { ...productData, shootingDate: e.target.value };
                          setProductData(updated);
                          saveWorkflowState(currentStage, completedStages, { product: updated });
                        }}
                        style={{ padding: '6px 10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #fbbf24', color: '#fff', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        placeholder="Time (e.g. 10:00 AM - 04:00 PM)"
                        value={productData.shootingTime}
                        onChange={(e) => {
                          const updated = { ...productData, shootingTime: e.target.value };
                          setProductData(updated);
                          saveWorkflowState(currentStage, completedStages, { product: updated });
                        }}
                        style={{ padding: '6px 10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #fbbf24', color: '#fff', fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          saveWorkflowState(currentStage, completedStages, { product: productData });
                          showToast("Schedule updated successfully");
                        }}
                        style={{ padding: '6px 12px', borderRadius: '8px', background: '#fbbf24', color: '#0f172a', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                      >
                        Save Schedule
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.stageGrid2}>
                {/* Left Card: Shooting Log & Notes */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#f472b6' }}>movie</span>
                      Shooting Notes & Raw Assets Repository
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className={styles.stageField}>
                      <label>Production Shoot Log & Notes</label>
                      <textarea
                        rows={4}
                        placeholder="e.g. Completed 12 shot setups. Lighting 3-point softbox with rim backlight. Audio captured on lavalier mic 1 & 2."
                        value={shootingData.shootingNotes}
                        onChange={(e) => {
                          const updated = { ...shootingData, shootingNotes: e.target.value };
                          setShootingData(updated);
                        }}
                        className={styles.stageTextarea}
                      />
                    </div>

                    <div className={styles.stageField}>
                      <label>Raw Footage Storage Link (Cloud / NAS Drive)</label>
                      <div className={styles.stageInputWrapper}>
                        <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>cloud_download</span>
                        <input
                          type="url"
                          placeholder="e.g. https://drive.google.com/drive/folders/raw-shoot-files"
                          value={shootingData.rawFootageUrl}
                          onChange={(e) => {
                            const updated = { ...shootingData, rawFootageUrl: e.target.value };
                            setShootingData(updated);
                          }}
                          className={styles.stageInput}
                        />
                      </div>
                    </div>

                    <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '12px', color: '#94a3b8' }}>
                      <span>Assigned Model: <strong style={{ color: '#f8fafc' }}>{productData.assignedModelName || 'None'}</strong></span>
                      <span style={{ marginLeft: '14px' }}>Location: <strong style={{ color: '#f8fafc' }}>{productData.studioLocation || 'Studio'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Assign Editor System */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#60a5fa' }}>person_pin</span>
                      Assign Video / Photo Editor
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className={styles.stageField}>
                      <label>Select Editor from Team</label>
                      <div className={styles.stageInputWrapper}>
                        <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>badge</span>
                        <select
                          value={shootingData.assignedEditorId}
                          onChange={(e) => {
                            const empId = e.target.value;
                            const emp = employees.find(em => em.id === empId);
                            const updated = {
                              ...shootingData,
                              assignedEditorId: empId,
                              assignedEditorName: emp ? `${emp.firstName} ${emp.lastName}` : shootingData.assignedEditorName
                            };
                            setShootingData(updated);
                          }}
                          className={styles.stageSelect}
                        >
                          <option value="">Select in-house staff editor...</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName} {emp.designation ? `(${emp.designation})` : ''}
                            </option>
                          ))}
                        </select>
                        <span className={`material-symbols-outlined ${styles.statusSelectChevron}`}>expand_more</span>
                      </div>
                    </div>

                    <div className={styles.stageField}>
                      <label>Or Enter Freelance / External Editor Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Rivera (Lead Colorist / Editor)"
                        value={shootingData.assignedEditorName}
                        onChange={(e) => {
                          const updated = { ...shootingData, assignedEditorName: e.target.value };
                          setShootingData(updated);
                        }}
                        className={styles.stageInput}
                        style={{ paddingLeft: '14px' }}
                      />
                    </div>

                    <div className={styles.stageField}>
                      <label>Editor Handover Instructions</label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Export 1x 60s Brand Hero Video (16:9 4K) and 4x 15s IG Reels with color grade."
                        value={shootingData.editorInstructions}
                        onChange={(e) => {
                          const updated = { ...shootingData, editorInstructions: e.target.value };
                          setShootingData(updated);
                        }}
                        className={styles.stageTextarea}
                      />
                    </div>

                    <div className={styles.stageField}>
                      <label>Expected Edit Delivery Date</label>
                      <input
                        type="date"
                        value={shootingData.expectedEditDelivery}
                        onChange={(e) => {
                          const updated = { ...shootingData, expectedEditDelivery: e.target.value };
                          setShootingData(updated);
                        }}
                        className={styles.stageInput}
                        style={{ paddingLeft: '14px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.stageBottomActions}>
                <button
                  type="button"
                  onClick={() => setCurrentStage(3)}
                  className={styles.stageBackBtn}
                >
                  &larr; Back to Stage 3
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveWorkflowState(5, Array.from(new Set([...completedStages, 4])), { shooting: shootingData });
                    handleAdvanceStage(5);
                  }}
                  className={styles.advanceBtn}
                >
                  Wrap Shooting & Advance to Stage 5: {stageNames[5] || 'Editing'} &rarr;
                </button>
              </div>
            </>
          )}

          {/* ------------------------------------------------------------------
              STAGE 5: EDITING (Post-Production, Editor Notes & Quality Checklist)
              ------------------------------------------------------------------ */}
          {currentStage === 5 && (
            <>
              <div className={styles.stageBanner}>
                <div className={styles.stageBannerLeft}>
                  <div className={styles.stageBadgeIcon} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>movie_edit</span>
                  </div>
                  <div>
                    <h2 className={styles.stageTitle}>Stage 5: {stageNames[5] || 'Editing'} (Post-Production)</h2>
                    <p className={styles.stageSubTitle}>
                      Manage editor workflows, review logs, format exports, and prepare deliverables for client demo.
                    </p>
                  </div>
                </div>
                <div className={styles.statusSelectWrapper}>
                  <select
                    value={editingData.status}
                    onChange={(e) => {
                      const updated = { ...editingData, status: e.target.value };
                      setEditingData(updated);
                      saveWorkflowState(currentStage, completedStages, { editing: updated });
                    }}
                    className={styles.stageSelect}
                    style={{ paddingLeft: '14px' }}
                  >
                    <option value="Ingesting Raw Files">Ingesting Raw Files</option>
                    <option value="Rough Cut Assembly">Rough Cut Assembly</option>
                    <option value="Color Grading & Audio Sync">Color Grading & Audio Sync</option>
                    <option value="VFX & Subtitles">VFX & Subtitles</option>
                    <option value="Review Ready">Review Ready</option>
                  </select>
                </div>
              </div>

              <div className={styles.stageGrid2}>
                {/* Left Card: Editor Notes & Format Specifications */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#818cf8' }}>edit_note</span>
                      Editor Notes & Project Deliverable Specs
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '10px 14px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '10px', fontSize: '12px', color: '#c7d2fe' }}>
                      <span>Assigned Editor: <strong style={{ color: '#ffffff' }}>{shootingData.assignedEditorName || 'Lead Editor'}</strong></span>
                      <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#a5b4fc' }}>
                        Instructions: {shootingData.editorInstructions || 'General deliverables cut.'}
                      </span>
                    </div>

                    <div className={styles.stageField}>
                      <label>Editor Changelog & Technical Notes</label>
                      <textarea
                        rows={4}
                        placeholder="e.g. Color grade matched with brand LUT #4. Sound design enhanced with Foley effects. 4K Master export rendered."
                        value={editingData.editorNotes}
                        onChange={(e) => {
                          const updated = { ...editingData, editorNotes: e.target.value };
                          setEditingData(updated);
                        }}
                        className={styles.stageTextarea}
                      />
                    </div>

                    <div className={styles.stageField}>
                      <label>Deliverable Specifications & Formats</label>
                      <input
                        type="text"
                        placeholder="e.g. 1080x1920 60fps MP4 (Reels) + 3840x2160 ProRes 422 (Master)"
                        value={editingData.deliverableSpecs}
                        onChange={(e) => {
                          const updated = { ...editingData, deliverableSpecs: e.target.value };
                          setEditingData(updated);
                        }}
                        className={styles.stageInput}
                        style={{ paddingLeft: '14px' }}
                      />
                    </div>

                    <div className={styles.stageField}>
                      <label>Working Project Cloud Repository (Frame.io / Dropbox)</label>
                      <div className={styles.stageInputWrapper}>
                        <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>link</span>
                        <input
                          type="url"
                          placeholder="e.g. https://frame.io/project/sample"
                          value={editingData.workingFileUrl}
                          onChange={(e) => {
                            const updated = { ...editingData, workingFileUrl: e.target.value };
                            setEditingData(updated);
                          }}
                          className={styles.stageInput}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Post-Production Quality Checklist */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#34d399' }}>checklist</span>
                      Milestone Quality Checklist
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      { key: 'audioCleaned', label: 'Audio Dialog Cleaned & Level Matched (-14 LUFS)' },
                      { key: 'colorGraded', label: 'Color Grading & Skin Tone Calibration Finished' },
                      { key: 'logoWatermarked', label: 'Brand Typography & Logo Overlays Applied' },
                      { key: 'subtitlesAdded', label: 'Captions / Subtitles Synced & Checked' },
                    ].map((item) => {
                      const isChecked = (editingData.checklist as any)[item.key];
                      return (
                        <label
                          key={item.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updated = {
                                ...editingData,
                                checklist: {
                                  ...editingData.checklist,
                                  [item.key]: e.target.checked
                                }
                              };
                              setEditingData(updated);
                              saveWorkflowState(currentStage, completedStages, { editing: updated });
                            }}
                            style={{ accentColor: '#10b981', width: '18px', height: '18px' }}
                          />
                          <span style={{ fontSize: '13px', color: isChecked ? '#34d399' : '#cbd5e1', fontWeight: isChecked ? 600 : 400 }}>
                            {item.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={styles.stageBottomActions}>
                <button
                  type="button"
                  onClick={() => setCurrentStage(4)}
                  className={styles.stageBackBtn}
                >
                  &larr; Back to Stage 4
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveWorkflowState(6, Array.from(new Set([...completedStages, 5])), { editing: editingData });
                    handleAdvanceStage(6);
                  }}
                  className={styles.advanceBtn}
                >
                  Complete Editing & Advance to Stage 6: {stageNames[6] || 'Demo'} &rarr;
                </button>
              </div>
            </>
          )}

          {/* ------------------------------------------------------------------
              STAGE 6: DEMO (Attachments, Client Revisions & Final Settlement)
              ------------------------------------------------------------------ */}
          {currentStage === 6 && (
            <>
              <div className={styles.stageBanner}>
                <div className={styles.stageBannerLeft}>
                  <div className={styles.stageBadgeIcon} style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>rate_review</span>
                  </div>
                  <div>
                    <h2 className={styles.stageTitle}>Stage 6: {stageNames[6] || 'Demo'} (Preview, Revisions & Settlement)</h2>
                    <p className={styles.stageSubTitle}>
                      Attach preview demos, log client revision notes, and finalize due settlement to complete project.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSettlementAmount(String(clientDue));
                    setIsSettlementModalOpen(true);
                  }}
                  className={styles.advanceBtn}
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
                  Complete Project
                </button>
              </div>

              <div className={styles.stageGrid2}>
                {/* Left Card: Demo Files & Attachments */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>attachment</span>
                      Attached Demo Preview Files & Links ({demoData.demoFiles.length})
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Add demo link form */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="Demo Label (e.g. Master Video v1.2)"
                        value={demoData.newDemoName}
                        onChange={(e) => setDemoData(prev => ({ ...prev, newDemoName: e.target.value }))}
                        className={styles.stageInput}
                        style={{ flex: 1, minWidth: '160px', paddingLeft: '12px' }}
                      />
                      <input
                        type="url"
                        placeholder="URL (e.g. https://vimeo.com/demo-review)"
                        value={demoData.newDemoUrl}
                        onChange={(e) => setDemoData(prev => ({ ...prev, newDemoUrl: e.target.value }))}
                        className={styles.stageInput}
                        style={{ flex: 1, minWidth: '180px', paddingLeft: '12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!demoData.newDemoName.trim() || !demoData.newDemoUrl.trim()) return;
                          const newFile = {
                            id: String(Date.now()),
                            name: demoData.newDemoName.trim(),
                            url: demoData.newDemoUrl.trim(),
                            date: new Date().toLocaleDateString()
                          };
                          const updated = {
                            ...demoData,
                            demoFiles: [...demoData.demoFiles, newFile],
                            newDemoName: '',
                            newDemoUrl: ''
                          };
                          setDemoData(updated);
                          saveWorkflowState(currentStage, completedStages, { demo: updated });
                          showToast("Demo file link attached");
                        }}
                        className={styles.advanceBtn}
                        style={{ padding: '8px 14px', fontSize: '12px' }}
                      >
                        + Attach
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                      {demoData.demoFiles.length > 0 ? (
                        demoData.demoFiles.map(file => (
                          <div
                            key={file.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 14px',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: '20px' }}>play_circle</span>
                              <div>
                                <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{file.name}</strong>
                                <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>Added {file.date}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(56, 189, 248, 0.15)',
                                  color: '#38bdf8',
                                  fontSize: '11px',
                                  textDecoration: 'none',
                                  fontWeight: 600
                                }}
                              >
                                View Demo ↗
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = {
                                    ...demoData,
                                    demoFiles: demoData.demoFiles.filter(f => f.id !== file.id)
                                  };
                                  setDemoData(updated);
                                  saveWorkflowState(currentStage, completedStages, { demo: updated });
                                }}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '12px' }}>
                          No demo files attached yet. Paste video / review URL above.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Card: Client Revisions & Approvals */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>published_with_changes</span>
                      Client Revision & Feedback Log
                    </h3>
                    <div className={styles.statusSelectWrapper}>
                      <select
                        value={demoData.approvalStatus}
                        onChange={(e) => {
                          const updated = { ...demoData, approvalStatus: e.target.value };
                          setDemoData(updated);
                          saveWorkflowState(currentStage, completedStages, { demo: updated });
                        }}
                        className={styles.stageSelect}
                        style={{ paddingLeft: '14px', fontSize: '12px' }}
                      >
                        <option value="Pending Review">Pending Review</option>
                        <option value="Revision Requested">Revision Requested</option>
                        <option value="Approved">Approved by Client</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className={styles.stageField}>
                      <label>Revision Notes & Client Feedback</label>
                      <textarea
                        rows={4}
                        placeholder="e.g. Client requested faster pacing in opening 5 seconds and color balance tweak on blue denim."
                        value={demoData.revisionNotes}
                        onChange={(e) => {
                          const updated = { ...demoData, revisionNotes: e.target.value };
                          setDemoData(updated);
                        }}
                        className={styles.stageTextarea}
                      />
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Outstanding Client Due:</span>
                      <strong style={{ fontSize: '14px', color: clientDue > 0 ? '#f87171' : '#34d399' }}>
                        {formatCurrency(clientDue)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSettlementAmount(String(clientDue));
                        setIsSettlementModalOpen(true);
                      }}
                      className={styles.advanceBtn}
                      style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>task_alt</span>
                      Review Due Payment & Complete Project &rarr;
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.stageBottomActions}>
                <button
                  type="button"
                  onClick={() => setCurrentStage(5)}
                  className={styles.stageBackBtn}
                >
                  &larr; Back to Stage 5
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettlementAmount(String(clientDue));
                    setIsSettlementModalOpen(true);
                  }}
                  className={styles.advanceBtn}
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  Complete Project & Advance to Stage 7 &rarr;
                </button>
              </div>
            </>
          )}

          {/* ------------------------------------------------------------------
              STAGE 7: COMPLETE (Celebration, Customer Add & Dashboard Link)
              ------------------------------------------------------------------ */}
          {currentStage === 7 && (
            <>
              <div className={styles.celebrationBanner}>
                <div className={styles.celebrationIconBox}>
                  <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>verified</span>
                </div>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    Project Successfully Completed & Delivered!
                  </h2>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                    All 7 pipeline milestones have been fulfilled. Contract deliverables and financials are archived.
                  </p>
                </div>

                <div className={styles.kpiGrid} style={{ width: '100%', maxWidth: '800px', marginTop: '10px' }}>
                  <div className={styles.kpiCard}>
                    <span className={styles.kpiLabel}>Final Contract Value</span>
                    <div className={styles.kpiMainValue} style={{ color: '#34d399' }}>{formatCurrency(budget)}</div>
                  </div>

                  <div className={styles.kpiCard}>
                    <span className={styles.kpiLabel}>Total Collected Revenue</span>
                    <div className={styles.kpiMainValue} style={{ color: '#38bdf8' }}>{formatCurrency(totalReceived)}</div>
                  </div>

                  <div className={styles.kpiCard}>
                    <span className={styles.kpiLabel}>Net Realized Profit</span>
                    <div className={styles.kpiMainValue} style={{ color: isLoss ? '#f87171' : '#34d399' }}>
                      {isLoss ? `-${formatCurrency(lossAmount)}` : `+${formatCurrency(realizedProfit)}`}
                    </div>
                  </div>
                </div>

                {/* Two Main Action Buttons requested by User */}
                <div className={styles.celebrationActions}>
                  <button
                    type="button"
                    onClick={handleLinkCustomer}
                    className={styles.customerActionBtn}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {isCustomerLinked ? 'how_to_reg' : 'person_add'}
                    </span>
                    {isCustomerLinked ? 'Linked to Customer Profile ✓' : 'Add to Customer'}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/erp/projects')}
                    className={styles.dashboardActionBtn}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      dashboard
                    </span>
                    Go to Projects Dashboard
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ====================================================================
            MODAL: WORKFLOW PIPELINE SETTINGS (DYNAMIC STAGE RENAMING)
            ==================================================================== */}
        {isSettingsModalOpen && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsSettingsModalOpen(false); }}>
            <div className={styles.modalContent} style={{ maxWidth: '520px' }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  <span className="material-symbols-outlined" style={{ color: '#c084fc', fontSize: '20px' }}>tune</span>
                  Customize Workflow Stage Names
                </h3>
                <button onClick={() => setIsSettingsModalOpen(false)} className={styles.closeBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>

              <form onSubmit={handleSaveCustomStageNames} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                  Rename any of the 7 progressive workflow stages to match your team's terminology:
                </p>

                {[1, 2, 3, 4, 5, 6, 7].map((sIndex) => (
                  <div key={sIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '24px', fontSize: '12px', fontWeight: 700, color: '#c084fc' }}>
                      #{sIndex}
                    </span>
                    <input
                      type="text"
                      required
                      value={customStageNames[sIndex] || ''}
                      onChange={(e) => setCustomStageNames(prev => ({ ...prev, [sIndex]: e.target.value }))}
                      className={styles.stageInput}
                      style={{ paddingLeft: '12px' }}
                    />
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStageNames(DEFAULT_STAGE_NAMES);
                    }}
                    className={styles.stageBackBtn}
                    style={{ fontSize: '12px', padding: '8px 14px' }}
                  >
                    Reset Defaults
                  </button>
                  <button
                    type="submit"
                    className={styles.advanceBtn}
                    style={{ padding: '8px 18px', fontSize: '13px' }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL: FINAL DUE SETTLEMENT (FULL, PARTIAL, PAY LATER)
            ==================================================================== */}
        {isSettlementModalOpen && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsSettlementModalOpen(false); }}>
            <div className={styles.modalContent} style={{ maxWidth: '560px' }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '20px' }}>payments</span>
                  Project Completion & Due Payment Settlement
                </h3>
                <button onClick={() => setIsSettlementModalOpen(false)} className={styles.closeBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Financial Due Summary */}
                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>Contract Budget</span>
                    <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{formatCurrency(budget)}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>Total Received</span>
                    <strong style={{ fontSize: '14px', color: '#34d399' }}>{formatCurrency(totalReceived)}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>Remaining Due</span>
                    <strong style={{ fontSize: '16px', color: clientDue > 0 ? '#f87171' : '#34d399' }}>{formatCurrency(clientDue)}</strong>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
                    Select Settlement Term:
                  </label>

                  <div className={styles.settlementGrid}>
                    <div
                      onClick={() => setSettlementOption('FULL')}
                      className={`${styles.settlementCard} ${settlementOption === 'FULL' ? styles.settlementCardActive : ''}`}
                    >
                      <span className={styles.settlementCardTitle}>
                        <span className="material-symbols-outlined" style={{ color: '#34d399', fontSize: '18px' }}>check_circle</span>
                        Full Payment
                      </span>
                      <p className={styles.settlementCardDesc}>
                        Collect full remaining due ({formatCurrency(clientDue)}) and settle balance to BDT 0.
                      </p>
                    </div>

                    <div
                      onClick={() => setSettlementOption('PARTIAL')}
                      className={`${styles.settlementCard} ${settlementOption === 'PARTIAL' ? styles.settlementCardActive : ''}`}
                    >
                      <span className={styles.settlementCardTitle}>
                        <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '18px' }}>toll</span>
                        Partial Pay
                      </span>
                      <p className={styles.settlementCardDesc}>
                        Enter custom partial collection amount now; balance remains on account.
                      </p>
                    </div>

                    <div
                      onClick={() => setSettlementOption('PAY_LATER')}
                      className={`${styles.settlementCard} ${settlementOption === 'PAY_LATER' ? styles.settlementCardActive : ''}`}
                    >
                      <span className={styles.settlementCardTitle}>
                        <span className="material-symbols-outlined" style={{ color: '#60a5fa', fontSize: '18px' }}>schedule</span>
                        Pay Later
                      </span>
                      <p className={styles.settlementCardDesc}>
                        Close project under credit terms; balance deferred to invoice.
                      </p>
                    </div>
                  </div>
                </div>

                {settlementOption === 'PARTIAL' && (
                  <div className={styles.stageField}>
                    <label>Partial Amount Collected Now (BDT) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 25,000"
                      value={settlementAmount}
                      onChange={(e) => setSettlementAmount(e.target.value)}
                      className={styles.stageInput}
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                )}

                {settlementOption !== 'PAY_LATER' && clientDue > 0 && (
                  <div className={styles.stageField}>
                    <label>Payment Method Channel</label>
                    <select
                      value={settlementMethod}
                      onChange={(e) => setSettlementMethod(e.target.value)}
                      className={styles.stageSelect}
                      style={{ paddingLeft: '14px' }}
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="bKash Merchant">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Cash">Cash in Hand</option>
                      <option value="Card / POS">Card / POS</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                )}

                <div className={styles.stageField}>
                  <label>Settlement Memo / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Final invoice #INV-2026-99 closed upon completion"
                    value={settlementNotes}
                    onChange={(e) => setSettlementNotes(e.target.value)}
                    className={styles.stageInput}
                    style={{ paddingLeft: '14px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setIsSettlementModalOpen(false)}
                    className={styles.stageBackBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingPayment}
                    onClick={handleExecuteSettlement}
                    className={styles.advanceBtn}
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                  >
                    {isSubmittingPayment ? 'Processing...' : 'Confirm & Complete Project ✓'}
                  </button>
                </div>
              </div>
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
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Project Code</label>
                    <input
                      type="text"
                      disabled
                      value={editForm.projectCode}
                      className={styles.inputField}
                      style={{ opacity: 0.7, cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Client Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Enterprise Client Ltd"
                      value={editForm.clientName}
                      onChange={(e) => setEditForm(f => ({ ...f, clientName: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Client Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +880 1712-345678"
                      value={editForm.clientPhone}
                      onChange={(e) => setEditForm(f => ({ ...f, clientPhone: e.target.value }))}
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
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Project Status</label>
                    <select
                      value={editForm.status || 'Draft'}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setEditForm(f => ({
                          ...f,
                          status: newStatus,
                          progress: newStatus === 'Completed' ? '100' : f.progress
                        }));
                      }}
                      className={styles.inputField}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review">Review</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.progress ?? 0}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                      setEditForm(f => ({
                        ...f,
                        progress: String(val),
                        status: val === 100 ? 'Completed' : (f.status === 'Completed' ? 'In Progress' : f.status)
                      }));
                    }}
                    className={styles.inputField}
                  />
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Expected Shooting Date</label>
                    <input
                      type="date"
                      value={editForm.expectedShootingDate}
                      onChange={(e) => setEditForm(f => ({ ...f, expectedShootingDate: e.target.value }))}
                      className={styles.inputField}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Expected Editing Date</label>
                    <input
                      type="date"
                      value={editForm.expectedEditingDate}
                      onChange={(e) => setEditForm(f => ({ ...f, expectedEditingDate: e.target.value }))}
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
                      Project Cost / Direct Expense (Deducted from Profit)
                    </label>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Optional</span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter direct project expense (e.g. 2200)"
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
                    <span>Cost Impact:</span>
                    <span>
                      Total Project Costs: <strong style={{ color: '#fca5a5' }}>{formatCurrency(actualCost + (Number(paymentForm.customCost) || 0))}</strong>
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

                {/* Live Position Preview */}
                {(Number(paymentForm.amount) > 0 || Number(paymentForm.customCost) > 0) && (() => {
                  const incomingPay = Number(paymentForm.amount) || 0;
                  const incomingCost = Number(paymentForm.customCost) || 0;
                  const newTotalReceived = totalReceived + incomingPay;
                  const newTotalCost = actualCost + incomingCost;
                  const newClientDue = Math.max(0, budget - newTotalReceived);
                  const newRealized = newTotalReceived - newTotalCost;
                  const newProjected = budget - newTotalCost;
                  return (
                    <div className={styles.previewBox}>
                      <span style={{ fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', fontSize: '11px' }}>
                        Live Financial Impact Preview:
                      </span>
                      {incomingPay > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>New Revenue Received:</span>
                          <strong style={{ color: '#34d399' }}>+{formatCurrency(incomingPay)} (Total: {formatCurrency(newTotalReceived)})</strong>
                        </div>
                      )}
                      {incomingCost > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fca5a5' }}>
                          <span>Direct Expense Added:</span>
                          <strong>-{formatCurrency(incomingCost)} (Total Cost: {formatCurrency(newTotalCost)})</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>New Realized Position:</span>
                        <strong style={{ color: newRealized >= 0 ? '#34d399' : '#f87171' }}>
                          {newRealized >= 0 ? `+${formatCurrency(newRealized)} (Profit)` : `-${formatCurrency(Math.abs(newRealized))} (Loss)`}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                        <span>Remaining Client Due:</span>
                        <span>{formatCurrency(newClientDue)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#38bdf8' }}>
                        <span>Projected Total Profit (on full payment):</span>
                        <strong>{formatCurrency(newProjected)}</strong>
                      </div>
                    </div>
                  );
                })()}

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
                    {isSubmittingPayment ? 'Processing...' : 'Save Payment'}
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
                                {emp.firstName?.[0] || 'E'}{emp.lastName?.[0] || ''}
                              </div>
                              <div>
                                <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px', display: 'block' }}>
                                  {emp.firstName || ''} {emp.lastName || ''}
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
                      Project Cost / Direct Expense (Deducted from Profit)
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
                  <span>Saving changes will recalculate project payments, cost expenses, and realized/projected profit records.</span>
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
