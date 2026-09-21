"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import styles from './workspace.module.css';
import RevisionChat from '@/app/erp/components/RevisionChat';

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

const format12Hour = (time24: string): string => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return time24;
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  const hDisplay = h < 10 ? `0${h}` : `${h}`;
  return `${hDisplay}:${m} ${ampm}`;
};

const parseTimeRange = (rangeStr: string): { start24: string; end24: string } => {
  if (!rangeStr) return { start24: '', end24: '' };
  const parts = rangeStr.split('-');
  const startPart = parts[0]?.trim() || '';
  const endPart = parts[1]?.trim() || '';

  const parseSingle = (s: string) => {
    if (!s) return '';
    const m = s.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
    if (!m) return '';
    let h = parseInt(m[1], 10);
    const min = m[2];
    const ampm = m[3]?.toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${min}`;
  };

  return {
    start24: parseSingle(startPart),
    end24: parseSingle(endPart)
  };
};

const formatTimeRange = (start24: string, end24: string): string => {
  if (start24 && end24) {
    return `${format12Hour(start24)} - ${format12Hour(end24)}`;
  }
  if (start24) {
    return format12Hour(start24);
  }
  if (end24) {
    return format12Hour(end24);
  }
  return '';
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
  const [productData, setProductData] = useState<{
    projectType: 'product' | 'service';
    productsList: Array<{ id: string; name: string; quantity: string; condition: string; notes?: string }>;
    scripts: Array<{ id: string; title: string; content?: string; url?: string }>;
    received: boolean;
    productName: string;
    quantity: string;
    category: string;
    condition: string;
    notes: string;
    shootingDate: string;
    shootingTime: string;
    studioLocation: string;
    assignedModelId: string;
    assignedModelName: string;
    modelRate: string;
    modelNotes: string;
    modelPaid?: boolean;
    modelPaidAmount?: number;
  }>({
    projectType: 'product',
    productsList: [],
    scripts: [],
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
    modelNotes: '',
    modelPaid: false,
    modelPaidAmount: 0
  });

  const [newProductForm, setNewProductForm] = useState({
    name: '',
    quantity: '',
    condition: 'Good',
    notes: ''
  });

  const [newScriptForm, setNewScriptForm] = useState({
    title: '',
    content: '',
    url: ''
  });

  // Stage 4 Shooting State
  const [shootingData, setShootingData] = useState<{
    status: string; // 'Scheduled' | 'In Progress' | 'Wrapped'
    shootingNotes: string;
    rawFootageUrl: string;
    rawFootageLinks: Array<{ id: string; label: string; url: string }>;
    assignedEditorId: string;
    assignedEditorName: string;
    editorInstructions: string;
    expectedEditDelivery: string;
    editorFee?: string;
    editorPaid?: boolean;
    editorPaidAmount?: number;
  }>({
    status: 'Scheduled', // 'Scheduled' | 'In Progress' | 'Wrapped'
    shootingNotes: '',
    rawFootageUrl: '',
    rawFootageLinks: [],
    assignedEditorId: '',
    assignedEditorName: '',
    editorInstructions: '',
    expectedEditDelivery: '',
    editorFee: '',
    editorPaid: false,
    editorPaidAmount: 0
  });

  // Stage 5 Editing State
  const [editingData, setEditingData] = useState<{
    status: string;
    editorNotes: string;
    deliverableSpecs: string;
    workingFileUrl: string;
    workingFiles: Array<{ id: string; label: string; url: string }>;
    finalVideoUrl?: string;
    finalVideoNotes?: string;
  }>({
    status: 'In Progress', // 'Ingesting' | 'Rough Cut' | 'Color Grading' | 'Review Ready'
    editorNotes: '',
    deliverableSpecs: '1080x1920 (9:16) & 16:9 4K Master',
    workingFileUrl: '',
    workingFiles: [
      { id: '1', label: 'Frame.io Project Link', url: '' }
    ],
    finalVideoUrl: '',
    finalVideoNotes: ''
  });

  // Stage 6 Demo & Revision State
  const [demoData, setDemoData] = useState({
    demoFiles: [] as { id: string; name: string; url: string; date: string; note?: string; uploadedBy?: string }[],
    newDemoName: '',
    newDemoUrl: '',
    revisionCount: 0,
    revisionNotes: '',
    freeRevisionsIncluded: 2,
    costPerRevision: 1000,
    isSpecialCustomerFree: false,
    approvalStatus: 'Pending Review' // 'Pending Review' | 'Revision Requested' | 'Approved'
  });

  // Inline Quick Actual Cost Edit
  const [isEditingActualCost, setIsEditingActualCost] = useState(false);
  const [actualCostInput, setActualCostInput] = useState<string>("");

  // Custom Edit Amount for Model & Editor in Stage 7
  const [isEditingModelRate, setIsEditingModelRate] = useState(false);
  const [tempModelRate, setTempModelRate] = useState('');
  const [isEditingEditorFee, setIsEditingEditorFee] = useState(false);
  const [tempEditorFee, setTempEditorFee] = useState('');

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [shareModalTab, setShareModalTab] = useState<'customer' | 'editor'>('customer');
  const [clientRevisions, setClientRevisions] = useState<any[]>([]);
  const [revisionChat, setRevisionChat] = useState<any[]>([]);
  const [clientReview, setClientReview] = useState<any>(null);
  const [editorRating, setEditorRating] = useState<any>(null);
  const [isRateEditorModalOpen, setIsRateEditorModalOpen] = useState(false);
  const [editorRatingValue, setEditorRatingValue] = useState(5);
  const [editorRatingFeedbackText, setEditorRatingFeedbackText] = useState('');
  const [isSubmittingEditorRating, setIsSubmittingEditorRating] = useState(false);
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [stage3ValidationError, setStage3ValidationError] = useState<string | null>(null);
  const [stage4ValidationError, setStage4ValidationError] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
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
              if (parsed.productData) {
                const pData = parsed.productData;
                if (!pData.scripts || !Array.isArray(pData.scripts)) {
                  pData.scripts = pData.script ? [{ id: '1', title: 'Main Script', content: pData.script }] : [];
                }
                if ((!pData.productsList || pData.productsList.length === 0) && pData.productName) {
                  pData.productsList = [{
                    id: 'legacy-1',
                    name: pData.productName,
                    quantity: pData.quantity || '1 item',
                    condition: pData.condition || 'Good',
                    notes: pData.notes || ''
                  }];
                }
                setProductData(prev => ({ ...prev, ...pData }));
              }
              if (parsed.shootingData) {
                const sData = parsed.shootingData;
                if (!sData.rawFootageLinks || !Array.isArray(sData.rawFootageLinks) || sData.rawFootageLinks.length === 0) {
                  sData.rawFootageLinks = sData.rawFootageUrl
                    ? [{ id: '1', label: 'Raw Shoot Footage (Cloud / NAS)', url: sData.rawFootageUrl }]
                    : [];
                }
                setShootingData(prev => ({ ...prev, ...sData }));
              }
              if (parsed.editingData) {
                const eData = parsed.editingData;
                const finalVid = parsed.finalVideoUrl || eData.finalVideoUrl || parsed.demoData?.finalVideoUrl || '';
                if (finalVid) eData.finalVideoUrl = finalVid;
                if (!eData.workingFiles || !Array.isArray(eData.workingFiles) || eData.workingFiles.length === 0) {
                  eData.workingFiles = eData.workingFileUrl
                    ? [{ id: '1', label: 'Frame.io / Cloud Link', url: eData.workingFileUrl }]
                    : [{ id: '1', label: 'Frame.io Project Link', url: '' }];
                }
                setEditingData(prev => ({ ...prev, ...eData }));
              }
              if (parsed.demoData) {
                const dData = parsed.demoData;
                const finalVid = parsed.finalVideoUrl || parsed.editingData?.finalVideoUrl || dData.finalVideoUrl || '';
                if (finalVid) dData.finalVideoUrl = finalVid;
                setDemoData(prev => ({
                  ...prev,
                  ...dData,
                  freeRevisionsIncluded: dData.freeRevisionsIncluded !== undefined ? Number(dData.freeRevisionsIncluded) : 2,
                  costPerRevision: dData.costPerRevision !== undefined ? Number(dData.costPerRevision) : 1000,
                  isSpecialCustomerFree: Boolean(dData.isSpecialCustomerFree)
                }));
              }
              if (parsed.revisions) setClientRevisions(parsed.revisions);
              if (parsed.revisionChat && Array.isArray(parsed.revisionChat)) {
                setRevisionChat(parsed.revisionChat);
              } else if (parsed.revisions && Array.isArray(parsed.revisions)) {
                setRevisionChat(parsed.revisions.map((r: any) => ({
                  id: r.id || String(Date.now()),
                  sender: 'CLIENT',
                  senderName: r.clientName || 'Client',
                  type: 'TEXT',
                  text: r.note || '',
                  timecode: r.timecode,
                  createdAt: r.createdAt || new Date().toISOString()
                })));
              }
              if (parsed.reviewData) setClientReview(parsed.reviewData);
              if (parsed.editorRating) setEditorRating(parsed.editorRating);
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
        demoData: demoToPersist,
        revisions: clientRevisions,
        revisionChat: revisionChat,
        reviewData: clientReview,
        editorRating: editorRating
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

  const handleSaveEditorRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEditorRating(true);
    try {
      const res = await fetch(`/api/portal/project/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RATE_EDITOR',
          rating: editorRatingValue,
          feedback: editorRatingFeedbackText.trim(),
          ratedBy: 'Studio Manager'
        })
      });
      if (res.ok) {
        const ratingObj = {
          rating: editorRatingValue,
          feedback: editorRatingFeedbackText.trim(),
          ratedBy: 'Studio Manager',
          submittedAt: new Date().toISOString()
        };
        setEditorRating(ratingObj);
        setIsRateEditorModalOpen(false);
        showToast("⭐ Editor performance rating recorded successfully!");
        fetchProject();
      } else {
        showToast("Failed to save editor rating", "error");
      }
    } catch (err) {
      showToast("Network error saving editor rating", "error");
    } finally {
      setIsSubmittingEditorRating(false);
    }
  };

  const handleToggleModelPaid = async () => {
    const isCurrentlyPaid = Boolean(productData.modelPaid);
    const rate = parseFloat(String(productData.modelRate || 0)) || 0;
    const modelName = productData.assignedModelName || 'Model Talent';
    const action = !isCurrentlyPaid ? 'PAY' : 'UNPAY';

    const updated = {
      ...productData,
      modelPaid: !isCurrentlyPaid,
      modelPaidAmount: !isCurrentlyPaid ? (productData.modelPaidAmount || rate) : 0
    };
    setProductData(updated);

    try {
      if (rate > 0) {
        const res = await fetch(`/api/projects/${projectId}/talent-settlement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "MODEL",
            name: modelName,
            amount: rate,
            action
          })
        });
        if (res.ok) {
          showToast(!isCurrentlyPaid ? `✓ Model ${modelName} marked as PAID & recorded in Finance (${formatCurrency(rate)})` : `Model payment marked as Unpaid & removed from Finance`);
        }
      } else {
        showToast(!isCurrentlyPaid ? `✓ Model ${modelName} marked as PAID` : `Model payment marked as Unpaid`);
      }
    } catch (err) {
      console.error("Talent settlement sync error:", err);
    }
    await saveWorkflowState(currentStage, completedStages, { product: updated });
    fetchProject();
  };

  const handleToggleEditorPaid = async () => {
    const isCurrentlyPaid = Boolean(shootingData.editorPaid);
    const fee = parseFloat(String(shootingData.editorFee || 0)) || (projectBasedStaff.find((pe: any) => pe.employeeId === shootingData.assignedEditorId)?.rate ? parseFloat(projectBasedStaff.find((pe: any) => pe.employeeId === shootingData.assignedEditorId)?.rate) : 0);
    const editorName = shootingData.assignedEditorName || 'Lead Editor';
    const action = !isCurrentlyPaid ? 'PAY' : 'UNPAY';

    const updated = {
      ...shootingData,
      editorPaid: !isCurrentlyPaid,
      editorPaidAmount: !isCurrentlyPaid ? (shootingData.editorPaidAmount || fee) : 0
    };
    setShootingData(updated);

    try {
      if (fee > 0) {
        const res = await fetch(`/api/projects/${projectId}/talent-settlement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "EDITOR",
            name: editorName,
            amount: fee,
            action
          })
        });
        if (res.ok) {
          showToast(!isCurrentlyPaid ? `✓ Editor ${editorName} marked as PAID & recorded in Finance (${formatCurrency(fee)})` : `Editor payment marked as Unpaid & removed from Finance`);
        }
      } else {
        showToast(!isCurrentlyPaid ? `✓ Editor ${editorName} marked as PAID` : `Editor payment marked as Unpaid`);
      }
    } catch (err) {
      console.error("Editor settlement sync error:", err);
    }
    await saveWorkflowState(currentStage, completedStages, { shooting: updated });
    fetchProject();
  };

  const handleSaveCustomModelRate = async (newRateStr: string) => {
    const num = Math.max(0, parseFloat(newRateStr) || 0);
    const updated = {
      ...productData,
      modelRate: String(num),
      modelPaidAmount: productData.modelPaid ? num : productData.modelPaidAmount
    };
    setProductData(updated);
    setIsEditingModelRate(false);
    showToast(`✓ Model rate updated to ${formatCurrency(num)}`);

    if (productData.modelPaid && num > 0) {
      try {
        await fetch(`/api/projects/${projectId}/talent-settlement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "MODEL",
            name: productData.assignedModelName || "Model Talent",
            amount: num,
            action: "PAY"
          })
        });
      } catch (e) {
        console.error(e);
      }
    }
    await saveWorkflowState(currentStage, completedStages, { product: updated });
    fetchProject();
  };

  const handleSaveCustomEditorFee = async (newFeeStr: string) => {
    const num = Math.max(0, parseFloat(newFeeStr) || 0);
    const updated = {
      ...shootingData,
      editorFee: String(num),
      editorPaidAmount: shootingData.editorPaid ? num : shootingData.editorPaidAmount
    };
    setShootingData(updated);
    setIsEditingEditorFee(false);
    showToast(`✓ Editor fee updated to ${formatCurrency(num)}`);

    if (shootingData.editorPaid && num > 0) {
      try {
        await fetch(`/api/projects/${projectId}/talent-settlement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "EDITOR",
            name: shootingData.assignedEditorName || "Lead Editor",
            amount: num,
            action: "PAY"
          })
        });
      } catch (e) {
        console.error(e);
      }
    }
    await saveWorkflowState(currentStage, completedStages, { shooting: updated });
    fetchProject();
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

  // Revision Billing computations
  const freeRevisionsIncluded = demoData.freeRevisionsIncluded !== undefined ? Number(demoData.freeRevisionsIncluded) : 2;
  const costPerRevision = demoData.costPerRevision !== undefined ? Number(demoData.costPerRevision) : 1000;
  const isSpecialCustomerFree = Boolean(demoData.isSpecialCustomerFree);
  const totalRevisionsCount = clientRevisions.length;
  const freeRevisionsUsed = isSpecialCustomerFree ? totalRevisionsCount : Math.min(freeRevisionsIncluded, totalRevisionsCount);
  const billableRevisionsCount = isSpecialCustomerFree ? 0 : Math.max(0, totalRevisionsCount - freeRevisionsIncluded);
  const totalRevisionFees = billableRevisionsCount * costPerRevision;

  // Project Financials & Collections Computations
  const payments = project.payments || [];
  const projectEmployees = project.projectEmployees || [];
  const totalReceived = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const effectiveBudget = budget + totalRevisionFees;
  const clientDue = Math.max(0, effectiveBudget - totalReceived);

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
        {toast && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: `1px solid ${toast.type === 'warning' ? '#f59e0b' : toast.type === 'error' ? '#ef4444' : '#a855f7'}`,
            boxShadow: `0 10px 25px -5px ${toast.type === 'warning' ? 'rgba(245, 158, 11, 0.4)' : toast.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`,
            color: '#f8fafc',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span className="material-symbols-outlined" style={{
              color: toast.type === 'warning' ? '#fbbf24' : toast.type === 'error' ? '#f87171' : '#34d399',
              fontSize: '18px'
            }}>
              {toast.type === 'warning' ? 'warning' : toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            {toast.message}
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
              {/* Customer Short Link Share Button (Visible only from Stage 3 and vanishes on complete) */}
              {currentStage >= 3 && currentStage < 7 && (
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className={styles.editBtn}
                  title="Share Customer Live Tracking Short Link"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)',
                    borderColor: '#a855f7',
                    color: '#e9d5ff',
                    fontWeight: 700
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#c084fc' }}>share</span>
                  Customer Short Link
                </button>
              )}

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

              {/* Delete Project Button (Redesigned) */}
              <button
                type="button"
                onClick={() => setIsDeleteProjectModalOpen(true)}
                className={styles.deleteProjectBtn}
                title="Permanently Delete Project"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                Delete Project
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
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#c084fc' }}>info</span>
                  Status: <strong style={{
                    color: project.status === 'Completed' ? '#34d399' : project.status === 'Active' ? '#60a5fa' : project.status === 'Draft' ? '#c084fc' : '#fbbf24'
                  }}>{project.status || 'Draft'}</strong>
                </span>

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
                {/* Left Card: Payment Confirmed or Advance Form */}
                {payments.length > 0 ? (
                  <div className={styles.stageCard}>
                    <div className={styles.stageCardHeader}>
                      <h3 className={styles.stageCardTitle}>
                        <span className="material-symbols-outlined" style={{ color: '#34d399' }}>verified</span>
                        Advance Payment Status
                      </h3>
                      <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>✓ Verified</span>
                    </div>

                    <div className={styles.paymentConfirmedBox}>
                      <div className={styles.paymentCheckCircle}>
                        <span className="material-symbols-outlined" style={{ fontSize: '38px', color: '#34d399', fontWeight: 700 }}>
                          check_circle
                        </span>
                      </div>

                      <div>
                        <div className={styles.paymentConfirmedBadge}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                          PAYMENT CONFIRMED
                        </div>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                          Advance Payment Received
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', maxWidth: '340px', lineHeight: '1.5' }}>
                          Advance payment of <strong style={{ color: '#34d399', fontSize: '14px' }}>{formatCurrency(totalReceived)}</strong> has been successfully received and credited to the project ledger.
                        </p>
                      </div>

                      <div className={styles.paymentSummaryGrid}>
                        <div className={styles.paymentSummaryItem}>
                          <span>Total Collected:</span>
                          <strong style={{ color: '#34d399' }}>{formatCurrency(totalReceived)}</strong>
                        </div>
                        <div className={styles.paymentSummaryItem}>
                          <span>Primary Method:</span>
                          <strong style={{ color: '#60a5fa' }}>{payments[0]?.paymentMethod || 'Bank Transfer'}</strong>
                        </div>
                        <div className={styles.paymentSummaryItem}>
                          <span>Last Payment Date:</span>
                          <span>{new Date(payments[0]?.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div className={styles.paymentSummaryItem}>
                          <span>Total Records:</span>
                          <span>{payments.length} transaction(s)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
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
                )}

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
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Next step: Proceed to Product Intake & Scheduling
                </span>
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
                  <div className={styles.stageBadgeIcon} style={{ background: productData.projectType === 'service' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                      {productData.projectType === 'service' ? 'design_services' : 'inventory_2'}
                    </span>
                  </div>
                  <div>
                    <h2 className={styles.stageTitle}>
                      Stage 3: {stageNames[3] || (productData.projectType === 'service' ? 'Service Planning' : 'Product Received')} ({productData.projectType === 'service' ? 'Schedule & Talent' : 'Inventory & Scheduling'})
                    </h2>
                    <p className={styles.stageSubTitle}>
                      {productData.projectType === 'service'
                        ? 'Schedule production dates and dynamically assign crew or model talent.'
                        : 'Verify received products, schedule shooting date & time, and dynamically assign model talent.'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: productData.projectType === 'service' ? '#60a5fa' : (productData.received ? '#34d399' : '#fbbf24'), fontWeight: 700 }}>
                    {productData.projectType === 'service' ? '⚡ Service Project' : (productData.received ? '✓ Products Verified' : 'Pending Receipt')}
                  </span>
                </div>
              </div>

              <div className={styles.stageGrid2}>
                {/* Left Card: Product Received Details or Service Mode */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>
                        {productData.projectType === 'service' ? 'design_services' : 'package_2'}
                      </span>
                      {productData.projectType === 'service' ? 'Service Configuration' : 'Product Intake & Inspection'}
                    </h3>
                    {(productData.projectType || 'product') === 'product' && (
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
                    )}
                  </div>

                  {/* Project Type Selector: Product Based vs Service Based */}
                  <div className={styles.projectTypeSelector}>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...productData, projectType: 'product' as const };
                        setProductData(updated);
                        saveWorkflowState(currentStage, completedStages, { product: updated });
                      }}
                      className={`${styles.typeBtn} ${(productData.projectType || 'product') === 'product' ? styles.typeBtnActiveProduct : ''}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>inventory_2</span>
                      Product Based
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...productData, projectType: 'service' as const };
                        setProductData(updated);
                        saveWorkflowState(currentStage, completedStages, { product: updated });
                      }}
                      className={`${styles.typeBtn} ${productData.projectType === 'service' ? styles.typeBtnActiveService : ''}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>design_services</span>
                      Service Based
                    </button>
                  </div>

                  {productData.projectType === 'service' ? (
                    <div className={styles.serviceEmptyBox}>
                      <div className={styles.serviceIconCircle}>
                        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>design_services</span>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                          Service Based Project Active
                        </h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', maxWidth: '320px', lineHeight: '1.5' }}>
                          No physical product intake or inventory inspection is required for this service. You can proceed directly to schedule dates and assign staff or talent on the right.
                        </p>
                      </div>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#34d399',
                        background: 'rgba(52, 211, 153, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: '1px solid rgba(52, 211, 153, 0.25)'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                        Ready to Proceed
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Product Entry Form */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className={styles.stageField}>
                          <label>Product / Collection Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Winter Denim & Leather Collection"
                            value={newProductForm.name}
                            onChange={(e) => setNewProductForm(prev => ({ ...prev, name: e.target.value }))}
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
                              value={newProductForm.quantity}
                              onChange={(e) => setNewProductForm(prev => ({ ...prev, quantity: e.target.value }))}
                              className={styles.stageInput}
                              style={{ paddingLeft: '14px' }}
                            />
                          </div>

                          <div className={styles.stageField}>
                            <label>Condition Assessment</label>
                            <select
                              value={newProductForm.condition}
                              onChange={(e) => setNewProductForm(prev => ({ ...prev, condition: e.target.value }))}
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
                            value={newProductForm.notes}
                            onChange={(e) => setNewProductForm(prev => ({ ...prev, notes: e.target.value }))}
                            className={styles.stageTextarea}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!newProductForm.name.trim()) {
                              showToast("Please enter a product name first");
                              return;
                            }
                            const newProduct = {
                              id: Date.now().toString(),
                              name: newProductForm.name.trim(),
                              quantity: newProductForm.quantity.trim() || '1 item',
                              condition: newProductForm.condition || 'Good',
                              notes: newProductForm.notes.trim()
                            };
                            const updatedList = [...(productData.productsList || []), newProduct];
                            const updated = {
                              ...productData,
                              productsList: updatedList,
                              productName: updatedList.map(p => p.name).join(', ')
                            };
                            setProductData(updated);
                            saveWorkflowState(currentStage, completedStages, { product: updated });
                            setNewProductForm({ name: '', quantity: '', condition: 'Good', notes: '' });
                            showToast("Product saved successfully! You can add another.");
                          }}
                          className={styles.addProductBtn}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                          + Save Product & Add Another
                        </button>
                      </div>

                      {/* Saved Products List */}
                      {productData.productsList && productData.productsList.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Saved Products ({productData.productsList.length})
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                            {productData.productsList.map((p, idx) => (
                              <div key={p.id || idx} className={styles.savedProductCard}>
                                <div className={styles.savedProductHeader}>
                                  <div className={styles.savedProductTitle}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fbbf24' }}>
                                      check_circle
                                    </span>
                                    {p.name}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedList = productData.productsList.filter((_, i) => i !== idx);
                                      const updated = {
                                        ...productData,
                                        productsList: updatedList,
                                        productName: updatedList.map(item => item.name).join(', ')
                                      };
                                      setProductData(updated);
                                      saveWorkflowState(currentStage, completedStages, { product: updated });
                                      showToast("Product removed");
                                    }}
                                    className={styles.deleteProductBtn}
                                    title="Delete product"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                  </button>
                                </div>

                                <div className={styles.savedProductTags}>
                                  <span className={styles.productQtyBadge}>{p.quantity}</span>
                                  <span className={styles.productConditionBadge}>{p.condition}</span>
                                </div>

                                {p.notes && (
                                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                                    {p.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label>Shooting Time Window *</label>
                          <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>Clock Selection</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div className={styles.stageInputWrapper}>
                              <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>schedule</span>
                              <input
                                type="time"
                                title="Start Time (Clock Selection)"
                                value={parseTimeRange(productData.shootingTime).start24}
                                onChange={(e) => {
                                  const cur = parseTimeRange(productData.shootingTime);
                                  const updatedTime = formatTimeRange(e.target.value, cur.end24);
                                  const updated = { ...productData, shootingTime: updatedTime };
                                  setProductData(updated);
                                  saveWorkflowState(currentStage, completedStages, { product: updated });
                                }}
                                className={styles.stageInput}
                                style={{ colorScheme: 'dark', cursor: 'pointer' }}
                              />
                            </div>
                            <div className={styles.stageInputWrapper}>
                              <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>schedule</span>
                              <input
                                type="time"
                                title="End Time (Clock Selection)"
                                value={parseTimeRange(productData.shootingTime).end24}
                                onChange={(e) => {
                                  const cur = parseTimeRange(productData.shootingTime);
                                  const updatedTime = formatTimeRange(cur.start24, e.target.value);
                                  const updated = { ...productData, shootingTime: updatedTime };
                                  setProductData(updated);
                                  saveWorkflowState(currentStage, completedStages, { product: updated });
                                }}
                                className={styles.stageInput}
                                style={{ colorScheme: 'dark', cursor: 'pointer' }}
                              />
                            </div>
                          </div>

                          {/* Quick Preset Buttons & Active Time Display */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {[
                                { label: '10 AM - 4 PM', start: '10:00', end: '16:00' },
                                { label: '2 PM - 8 PM', start: '14:00', end: '20:00' },
                                { label: 'Full Day', start: '09:00', end: '18:00' },
                              ].map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => {
                                    const updatedTime = formatTimeRange(preset.start, preset.end);
                                    const updated = { ...productData, shootingTime: updatedTime };
                                    setProductData(updated);
                                    saveWorkflowState(currentStage, completedStages, { product: updated });
                                  }}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: '#cbd5e1',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                            {productData.shootingTime && (
                              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                                🕒 {productData.shootingTime}
                              </span>
                            )}
                          </div>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Model Assignment (Dynamic & Changeable) <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                        </label>
                        <span style={{ fontSize: '10px', color: '#f472b6', fontWeight: 600 }}>Talent System</span>
                      </div>

                      {/* Quick Model / Talent Selector Dropdown */}
                      <div style={{ marginBottom: '8px' }}>
                        <select
                          value={
                            employees.some(e => `${e.firstName} ${e.lastName}` === productData.assignedModelName)
                              ? employees.find(e => `${e.firstName} ${e.lastName}` === productData.assignedModelName)?.id
                              : productData.assignedModelName
                              ? 'custom'
                              : ''
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              const updated = { ...productData, assignedModelName: '', assignedModelId: '' };
                              setProductData(updated);
                              saveWorkflowState(currentStage, completedStages, { product: updated });
                            } else if (val === 'custom') {
                              // Keep current value
                            } else {
                              const emp = employees.find(em => em.id === val);
                              if (emp) {
                                const updated = {
                                  ...productData,
                                  assignedModelId: emp.id,
                                  assignedModelName: `${emp.firstName} ${emp.lastName}`
                                };
                                setProductData(updated);
                                setStage3ValidationError(null);
                                saveWorkflowState(currentStage, completedStages, { product: updated });
                              } else {
                                const updated = {
                                  ...productData,
                                  assignedModelId: '',
                                  assignedModelName: val
                                };
                                setProductData(updated);
                                setStage3ValidationError(null);
                                saveWorkflowState(currentStage, completedStages, { product: updated });
                              }
                            }
                          }}
                          className={styles.stageSelect}
                          style={{
                            paddingLeft: '14px',
                            fontSize: '12px',
                            borderColor: stage3ValidationError ? '#ef4444' : undefined,
                            background: '#131d2e'
                          }}
                        >
                          <option value="">-- Select Model / Talent or enter below --</option>
                          {employees.length > 0 && (
                            <optgroup label="In-House Staff & Team">
                              {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.firstName} {emp.lastName} {emp.designation ? `(${emp.designation})` : ''}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="Preset Talent Agencies / Options">
                            <option value="Sarah Miller - Elite Agency">Sarah Miller - Elite Agency</option>
                            <option value="Elena Rostova - Elite Model">Elena Rostova - Elite Model</option>
                            <option value="Freelance Fashion Model">Freelance Fashion Model</option>
                            <option value="Commercial Talent (Agency)">Commercial Talent (Agency)</option>
                          </optgroup>
                          {productData.assignedModelName && (
                            <option value="custom">Current: {productData.assignedModelName}</option>
                          )}
                        </select>
                      </div>

                      <div className={styles.stageInputWrapper}>
                        <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>face</span>
                        <input
                          id="stage3-model-input"
                          type="text"
                          placeholder="e.g. Sarah Miller - Elite Agency (or select/enter talent)"
                          value={productData.assignedModelName}
                          onChange={(e) => {
                            const updated = { ...productData, assignedModelName: e.target.value };
                            setProductData(updated);
                            if (e.target.value.trim()) {
                              setStage3ValidationError(null);
                            }
                          }}
                          className={styles.stageInput}
                          style={stage3ValidationError ? { borderColor: '#ef4444', boxShadow: '0 0 0 1px #ef4444' } : undefined}
                        />
                      </div>

                      {stage3ValidationError && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#f87171',
                          fontSize: '12px',
                          fontWeight: 600,
                          marginTop: '6px',
                          padding: '6px 10px',
                          background: 'rgba(239, 68, 68, 0.12)',
                          borderRadius: '8px',
                          border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#ef4444' }}>warning</span>
                          {stage3ValidationError}
                        </div>
                      )}
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

              {/* Creative Script & Storyboard Management Card (Multiple Scripts System) */}
              <div className={styles.stageCard} style={{ marginTop: '16px', border: '1px solid rgba(251, 191, 36, 0.25)', background: 'rgba(251, 191, 36, 0.02)' }}>
                <div className={styles.stageCardHeader}>
                  <h3 className={styles.stageCardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>description</span>
                    Creative Script & Storyboard Management (Multiple Scripts)
                  </h3>
                  <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600 }}>
                    {productData.scripts?.length || 0} Scripts Saved
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                    Add voiceover scripts, shot-by-shot storyboards, scene dialogues, or external Google Docs/Notion links for production crew and client reference.
                  </p>

                  {/* New Script Input Box */}
                  <div style={{
                    padding: '14px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                      <div className={styles.stageField}>
                        <label>Script Title / Scene / Version *</label>
                        <input
                          type="text"
                          placeholder="e.g. Master Hook Script v1.0 / Scene 1-4 Voiceover"
                          value={newScriptForm.title}
                          onChange={(e) => setNewScriptForm(prev => ({ ...prev, title: e.target.value }))}
                          className={styles.stageInput}
                          style={{ paddingLeft: '12px' }}
                        />
                      </div>

                      <div className={styles.stageField}>
                        <label>Script Cloud / Document Link (Optional)</label>
                        <div className={styles.stageInputWrapper}>
                          <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>link</span>
                          <input
                            type="url"
                            placeholder="e.g. https://docs.google.com/document/d/..."
                            value={newScriptForm.url}
                            onChange={(e) => setNewScriptForm(prev => ({ ...prev, url: e.target.value }))}
                            className={styles.stageInput}
                            style={{ fontSize: '12px' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.stageField}>
                      <label>Script Content / Dialogue / Storyboard Notes</label>
                      <textarea
                        rows={3}
                        placeholder="Paste full script text, dialogue cues, character prompts, or voiceover lines here..."
                        value={newScriptForm.content}
                        onChange={(e) => setNewScriptForm(prev => ({ ...prev, content: e.target.value }))}
                        className={styles.stageTextarea}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newScriptForm.title.trim() && !newScriptForm.content.trim() && !newScriptForm.url.trim()) {
                          showToast("Please enter a script title or content");
                          return;
                        }
                        const newScript = {
                          id: Date.now().toString(),
                          title: newScriptForm.title.trim() || `Script #${(productData.scripts?.length || 0) + 1}`,
                          content: newScriptForm.content.trim(),
                          url: newScriptForm.url.trim()
                        };
                        const updatedScripts = [...(productData.scripts || []), newScript];
                        const updated = { ...productData, scripts: updatedScripts };
                        setProductData(updated);
                        saveWorkflowState(currentStage, completedStages, { product: updated });
                        setNewScriptForm({ title: '', content: '', url: '' });
                        showToast("✓ Script added successfully! You can add multiple scripts.");
                      }}
                      className={styles.addProductBtn}
                      style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', alignSelf: 'flex-start' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                      + Save Script & Add Another
                    </button>
                  </div>

                  {/* Saved Scripts List */}
                  {productData.scripts && productData.scripts.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Saved Scripts ({productData.scripts.length})
                      </span>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
                        {productData.scripts.map((script, idx) => (
                          <div
                            key={script.id || idx}
                            style={{
                              padding: '12px 14px',
                              background: 'rgba(0, 0, 0, 0.3)',
                              border: '1px solid rgba(251, 191, 36, 0.2)',
                              borderRadius: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fbbf24' }}>description</span>
                                {script.title || `Script #${idx + 1}`}
                              </strong>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {script.url && (
                                  <a
                                    href={script.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      background: 'rgba(56, 189, 248, 0.15)',
                                      color: '#38bdf8',
                                      fontSize: '11px',
                                      textDecoration: 'none',
                                      fontWeight: 600,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px'
                                    }}
                                  >
                                    Open Link ↗
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedScripts = (productData.scripts || []).filter((_, i) => i !== idx);
                                    const updated = { ...productData, scripts: updatedScripts };
                                    setProductData(updated);
                                    saveWorkflowState(currentStage, completedStages, { product: updated });
                                    showToast("Script removed");
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Delete script"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                </button>
                              </div>
                            </div>

                            {script.content && (
                              <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', whiteSpace: 'pre-line', maxHeight: '120px', overflowY: 'auto', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '6px' }}>
                                {script.content}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Warning Alert in Stage 3 */}
              {stage3ValidationError && (
                <div className={styles.warningAlert} style={{ marginTop: '14px', borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.14)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '24px', flexShrink: 0 }}>
                    error
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#fca5a5' }}>Model Assignment Required!</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#fecaca' }}>
                      {stage3ValidationError}
                    </p>
                  </div>
                </div>
              )}

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
                    if (!productData.assignedModelName || !productData.assignedModelName.trim()) {
                      const errorMsg = "Model is not assigned! Please select or enter a model talent before confirming.";
                      setStage3ValidationError(errorMsg);
                      showToast(`⚠️ ${errorMsg}`, 'warning');
                      const el = document.getElementById('stage3-model-input');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.focus();
                      }
                      return;
                    }
                    setStage3ValidationError(null);
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                      <input
                        type="date"
                        value={productData.shootingDate}
                        onChange={(e) => {
                          const updated = { ...productData, shootingDate: e.target.value };
                          setProductData(updated);
                          saveWorkflowState(currentStage, completedStages, { product: updated });
                        }}
                        style={{ padding: '6px 10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #fbbf24', color: '#fff', fontSize: '12px', colorScheme: 'dark' }}
                      />

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#1e293b', padding: '3px 8px', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                        <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '16px' }}>schedule</span>
                        <input
                          type="time"
                          title="Start Time (Clock Selection)"
                          value={parseTimeRange(productData.shootingTime).start24}
                          onChange={(e) => {
                            const cur = parseTimeRange(productData.shootingTime);
                            const updatedTime = formatTimeRange(e.target.value, cur.end24);
                            const updated = { ...productData, shootingTime: updatedTime };
                            setProductData(updated);
                            saveWorkflowState(currentStage, completedStages, { product: updated });
                          }}
                          style={{
                            padding: '3px 6px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#fff',
                            fontSize: '12px',
                            colorScheme: 'dark',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 600 }}>to</span>
                        <input
                          type="time"
                          title="End Time (Clock Selection)"
                          value={parseTimeRange(productData.shootingTime).end24}
                          onChange={(e) => {
                            const cur = parseTimeRange(productData.shootingTime);
                            const updatedTime = formatTimeRange(cur.start24, e.target.value);
                            const updated = { ...productData, shootingTime: updatedTime };
                            setProductData(updated);
                            saveWorkflowState(currentStage, completedStages, { product: updated });
                          }}
                          style={{
                            padding: '3px 6px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#fff',
                            fontSize: '12px',
                            colorScheme: 'dark',
                            cursor: 'pointer'
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          saveWorkflowState(currentStage, completedStages, { product: productData });
                          showToast("Schedule updated successfully");
                        }}
                        style={{ padding: '6px 14px', borderRadius: '8px', background: '#fbbf24', color: '#0f172a', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label>Raw Footage Storage Links (Cloud / NAS Drive)</label>
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = Array.isArray(shootingData.rawFootageLinks) ? shootingData.rawFootageLinks : [];
                            const updatedLinks = [
                              ...currentLinks,
                              { id: String(Date.now()), label: '', url: '' }
                            ];
                            const updated = { ...shootingData, rawFootageLinks: updatedLinks };
                            setShootingData(updated);
                            saveWorkflowState(currentStage, completedStages, { shooting: updated });
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(244, 114, 182, 0.15)',
                            border: '1px solid rgba(244, 114, 182, 0.35)',
                            color: '#f472b6',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                          + Add Raw Link
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(Array.isArray(shootingData.rawFootageLinks) && shootingData.rawFootageLinks.length > 0
                          ? shootingData.rawFootageLinks
                          : [{ id: '1', label: 'Primary Raw Footage Link', url: shootingData.rawFootageUrl || '' }]
                        ).map((rf, idx) => (
                          <div
                            key={rf.id || idx}
                            style={{
                              padding: '8px 10px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <input
                                type="text"
                                placeholder="Label (e.g. Cam A 4K Card 1 / Audio Stems / NAS Backup)"
                                value={rf.label}
                                onChange={(e) => {
                                  const currentLinks = Array.isArray(shootingData.rawFootageLinks) && shootingData.rawFootageLinks.length > 0
                                    ? [...shootingData.rawFootageLinks]
                                    : [{ id: '1', label: 'Primary Raw Footage Link', url: shootingData.rawFootageUrl || '' }];
                                  currentLinks[idx] = { ...currentLinks[idx], label: e.target.value };
                                  const updated = {
                                    ...shootingData,
                                    rawFootageLinks: currentLinks,
                                    rawFootageUrl: currentLinks[0]?.url || ''
                                  };
                                  setShootingData(updated);
                                }}
                                className={styles.stageInput}
                                style={{ flex: 1, paddingLeft: '8px', fontSize: '12px' }}
                              />

                              {rf.url && (
                                <a
                                  href={rf.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(244, 114, 182, 0.15)',
                                    color: '#f472b6',
                                    fontSize: '11px',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  Open ↗
                                </a>
                              )}

                              {(shootingData.rawFootageLinks?.length || 1) > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentLinks = (shootingData.rawFootageLinks || []).filter((_, i) => i !== idx);
                                    const updated = {
                                      ...shootingData,
                                      rawFootageLinks: currentLinks,
                                      rawFootageUrl: currentLinks[0]?.url || ''
                                    };
                                    setShootingData(updated);
                                    saveWorkflowState(currentStage, completedStages, { shooting: updated });
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Remove Link"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                </button>
                              )}
                            </div>

                            <div className={styles.stageInputWrapper}>
                              <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>cloud_download</span>
                              <input
                                type="url"
                                placeholder="https://drive.google.com/... or https://dropbox.com/... or NAS link"
                                value={rf.url}
                                onChange={(e) => {
                                  const currentLinks = Array.isArray(shootingData.rawFootageLinks) && shootingData.rawFootageLinks.length > 0
                                    ? [...shootingData.rawFootageLinks]
                                    : [{ id: '1', label: 'Primary Raw Footage Link', url: shootingData.rawFootageUrl || '' }];
                                  currentLinks[idx] = { ...currentLinks[idx], url: e.target.value };
                                  const updated = {
                                    ...shootingData,
                                    rawFootageLinks: currentLinks,
                                    rawFootageUrl: currentLinks[0]?.url || ''
                                  };
                                  setShootingData(updated);
                                }}
                                className={styles.stageInput}
                                style={{ fontSize: '12px' }}
                              />
                            </div>
                          </div>
                        ))}
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
                      <label>Select Editor from Team <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></label>
                      <div className={styles.stageInputWrapper}>
                        <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>badge</span>
                        <select
                          id="stage4-editor-select"
                          value={shootingData.assignedEditorId}
                          onChange={(e) => {
                            const empId = e.target.value;
                            const emp = employees.find(em => em.id === empId);
                            const updated = {
                              ...shootingData,
                              assignedEditorId: empId,
                              assignedEditorName: emp ? `${emp.firstName} ${emp.lastName}` : (empId === '' ? '' : shootingData.assignedEditorName)
                            };
                            setShootingData(updated);
                            if (empId || updated.assignedEditorName?.trim()) {
                              setStage4ValidationError(null);
                            }
                          }}
                          className={styles.stageSelect}
                          style={stage4ValidationError ? { borderColor: '#ef4444', boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)' } : undefined}
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
                        id="stage4-editor-input"
                        type="text"
                        placeholder="e.g. Alex Rivera (Lead Colorist / Editor)"
                        value={shootingData.assignedEditorName}
                        onChange={(e) => {
                          const updated = { ...shootingData, assignedEditorName: e.target.value };
                          setShootingData(updated);
                          if (e.target.value.trim() || shootingData.assignedEditorId) {
                            setStage4ValidationError(null);
                          }
                        }}
                        className={styles.stageInput}
                        style={{
                          paddingLeft: '14px',
                          ...(stage4ValidationError ? { borderColor: '#ef4444', boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)' } : {})
                        }}
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

              {/* Validation Warning Alert in Stage 4 */}
              {stage4ValidationError && (
                <div className={styles.warningAlert} style={{ marginTop: '14px', borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.14)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '24px', flexShrink: 0 }}>
                    error
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#fca5a5' }}>Editor Assignment Required!</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#fecaca' }}>
                      {stage4ValidationError}
                    </p>
                  </div>
                </div>
              )}

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
                    const hasEditor = Boolean(
                      (shootingData.assignedEditorId && shootingData.assignedEditorId.trim()) ||
                      (shootingData.assignedEditorName && shootingData.assignedEditorName.trim())
                    );
                    if (!hasEditor) {
                      const errorMsg = "Editor is not assigned! Please select an in-house editor or enter an external editor before advancing to Stage 5.";
                      setStage4ValidationError(errorMsg);
                      showToast(`⚠️ ${errorMsg}`, 'warning');
                      const el = document.getElementById('stage4-editor-select') || document.getElementById('stage4-editor-input');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.focus();
                      }
                      return;
                    }
                    setStage4ValidationError(null);
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

              {/* Saved Stage 4 Raw Footage Repositories Reference Banner */}
              {((Array.isArray(shootingData.rawFootageLinks) && shootingData.rawFootageLinks.filter(f => f.url).length > 0) || shootingData.rawFootageUrl) && (
                <div style={{
                  marginBottom: '16px',
                  padding: '14px 18px',
                  background: 'rgba(236, 72, 153, 0.08)',
                  border: '1px solid rgba(236, 72, 153, 0.25)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <strong style={{ fontSize: '13px', color: '#f472b6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cloud_download</span>
                      Saved Stage 4 Raw Shoot Footage Repositories ({Array.isArray(shootingData.rawFootageLinks) && shootingData.rawFootageLinks.filter(f => f.url).length > 0 ? shootingData.rawFootageLinks.filter(f => f.url).length : (shootingData.rawFootageUrl ? 1 : 0)})
                    </strong>
                    <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Direct links for Editor Ingest</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(Array.isArray(shootingData.rawFootageLinks) && shootingData.rawFootageLinks.length > 0
                      ? shootingData.rawFootageLinks.filter(f => f.url)
                      : shootingData.rawFootageUrl
                      ? [{ id: '1', label: 'Primary Raw Footage', url: shootingData.rawFootageUrl }]
                      : []
                    ).map((rf, i) => (
                      <a
                        key={rf.id || i}
                        href={rf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(236, 72, 153, 0.15)',
                          border: '1px solid rgba(236, 72, 153, 0.3)',
                          color: '#fbcfe8',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#f472b6' }}>folder_zip</span>
                        {rf.label || `Raw Footage #${i + 1}`} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}

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
                  </div>
                </div>

                {/* Right Card: Working Project Cloud Repository & Editor Short Link */}
                <div className={styles.stageCard}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>folder_open</span>
                      Working Project Cloud Repository (Frame.io / Dropbox)
                    </h3>
                    {editingData.workingFileUrl && (
                      <a
                        href={editingData.workingFileUrl}
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
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Open Repository ↗
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                      Working project cloud repository for the editor (e.g. Frame.io bin, Dropbox project folder, or cloud project files):
                    </p>

                    <div className={styles.stageField}>
                      <label>Working Project Cloud Repository Link</label>
                      <div className={styles.stageInputWrapper}>
                        <span className={`material-symbols-outlined ${styles.stageInputIcon}`}>folder_shared</span>
                        <input
                          type="url"
                          placeholder="https://frame.io/... or https://dropbox.com/..."
                          value={editingData.workingFileUrl || (Array.isArray(editingData.workingFiles) ? editingData.workingFiles[0]?.url : '') || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = {
                              ...editingData,
                              workingFileUrl: val,
                              workingFiles: [{ id: '1', label: 'Working Project Cloud Repository', url: val }]
                            };
                            setEditingData(updated);
                            saveWorkflowState(currentStage, completedStages, { editing: updated });
                          }}
                          className={styles.stageInput}
                          style={{ fontSize: '12px' }}
                        />
                      </div>
                    </div>

                    {/* Dedicated Editor Short Link Box */}
                    <div
                      style={{
                        marginTop: '6px',
                        padding: '12px 14px',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '12px', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#818cf8' }}>badge</span>
                          Dedicated Editor Short Link
                        </strong>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>For Assigned Editor</span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          readOnly
                          value={typeof window !== 'undefined' ? `${window.location.origin}/e/${projectId}` : `/e/${projectId}`}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: '#0f172a',
                            border: '1px solid rgba(99, 102, 241, 0.4)',
                            color: '#e2e8f0',
                            fontFamily: 'monospace',
                            fontSize: '11px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/e/${projectId}`;
                            navigator.clipboard.writeText(url);
                            showToast("🎬 Editor Short Link copied to clipboard!");
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '11px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Copy Link
                        </button>
                        <a
                          href={`/portal/editor/${projectId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#cbd5e1',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            fontSize: '11px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Preview ↗
                        </a>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        💡 The editor can view instructions, open all project cloud repositories, submit completed demo cuts, and view live client revisions on this link.
                      </span>
                    </div>
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

              {/* Final Master Video Delivery Link Banner (Submitted by Editor) */}
              {(editingData.finalVideoUrl || demoData.finalVideoUrl) && (
                <div style={{
                  marginBottom: '14px',
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(3, 105, 161, 0.25) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: '26px' }}>movie</span>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>
                        🎬 Final Master Video Delivery Link (Submitted by Editor)
                      </strong>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Internal CRM Asset Archive • Only visible in CRM</span>
                    </div>
                  </div>
                  <a
                    href={editingData.finalVideoUrl || demoData.finalVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '12px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                    Open Master Video ↗
                  </a>
                </div>
              )}

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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{file.name}</strong>
                                  {file.uploadedBy && (
                                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', fontWeight: 600 }}>
                                      🎬 {file.uploadedBy}
                                    </span>
                                  )}
                                </div>
                                <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>Added {file.date}</span>
                                {file.note && (
                                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic' }}>"{file.note}"</p>
                                )}
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

                    {/* Revision Billing & Policy Configuration */}
                    <div style={{ marginTop: '14px', padding: '14px', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '18px' }}>receipt_long</span>
                          <strong style={{ fontSize: '12px', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Revision Policy & Billing
                          </strong>
                        </div>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#cbd5e1', cursor: 'pointer', background: isSpecialCustomerFree ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <input
                            type="checkbox"
                            checked={isSpecialCustomerFree}
                            onChange={(e) => {
                              const updated = { ...demoData, isSpecialCustomerFree: e.target.checked };
                              setDemoData(updated);
                              saveWorkflowState(currentStage, completedStages, { demo: updated });
                              showToast(e.target.checked ? "👑 Special Customer: Free unlimited revisions activated" : "Standard revision policy restored");
                            }}
                          />
                          <span style={{ fontWeight: 600, color: isSpecialCustomerFree ? '#c084fc' : '#94a3b8' }}>👑 Special Customer (Free Unlimited Revisions)</span>
                        </label>
                      </div>

                      {!isSpecialCustomerFree && (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '130px' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>Free Revisions Included</label>
                            <input
                              type="number"
                              min="0"
                              value={demoData.freeRevisionsIncluded ?? 2}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                const updated = { ...demoData, freeRevisionsIncluded: val };
                                setDemoData(updated);
                                saveWorkflowState(currentStage, completedStages, { demo: updated });
                              }}
                              className={styles.stageInput}
                              style={{ paddingLeft: '10px', fontSize: '12px', height: '32px' }}
                            />
                          </div>

                          <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>Fee Per Extra Revision (BDT)</label>
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={demoData.costPerRevision ?? 1000}
                              onChange={(e) => {
                                const val = Math.max(0, parseFloat(e.target.value) || 0);
                                const updated = { ...demoData, costPerRevision: val };
                                setDemoData(updated);
                                saveWorkflowState(currentStage, completedStages, { demo: updated });
                              }}
                              className={styles.stageInput}
                              style={{ paddingLeft: '10px', fontSize: '12px', height: '32px' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Revision Rounds Tally Pill */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '11px', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ color: '#94a3b8' }}>
                          Total Revisions: <strong style={{ color: '#f8fafc' }}>{totalRevisionsCount} rounds</strong>
                        </span>
                        {isSpecialCustomerFree ? (
                          <span style={{ color: '#c084fc', fontWeight: 600 }}>👑 VIP Free Client (BDT 0)</span>
                        ) : (
                          <span style={{ color: billableRevisionsCount > 0 ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                            {freeRevisionsUsed}/{freeRevisionsIncluded} Free Used • {billableRevisionsCount} Billable (+{formatCurrency(totalRevisionFees)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Client Revision Chat & Settlement */}
                <div className={styles.stageCard} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className={styles.stageCardHeader}>
                    <h3 className={styles.stageCardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>forum</span>
                      Customer Revision Chat & Approvals
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

                  {/* Interactive Real-Time Revision Chat */}
                  <RevisionChat
                    projectId={projectId}
                    currentUserRole="STUDIO"
                    currentUserName="Studio Manager"
                    messages={revisionChat}
                    demoFiles={demoData.demoFiles}
                    onRefresh={fetchProject}
                  />

                  {/* Outstanding Due & Revision Policy Breakdown (Button removed per user request) */}
                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Outstanding Client Due {totalRevisionFees > 0 ? `(incl. ${formatCurrency(totalRevisionFees)} revision fees)` : ''}:
                      </span>
                      <strong style={{ fontSize: '16px', color: clientDue > 0 ? '#f87171' : '#34d399' }}>
                        {formatCurrency(clientDue)}
                      </strong>
                    </div>
                    <div>
                      {isSpecialCustomerFree ? (
                        <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', fontWeight: 600, fontSize: '11px' }}>
                          👑 VIP Free Revisions
                        </span>
                      ) : billableRevisionsCount > 0 ? (
                        <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', fontWeight: 600, fontSize: '11px' }}>
                          💳 {billableRevisionsCount} Billable Rev. (+{formatCurrency(totalRevisionFees)})
                        </span>
                      ) : (
                        <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600, fontSize: '11px' }}>
                          ✓ Within Free Allowance ({freeRevisionsUsed}/{freeRevisionsIncluded})
                        </span>
                      )}
                    </div>
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
              STAGE 7: COMPLETE (Invoice Ledger, Model/Editor Settlements & Download Invoice)
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
                    All 7 pipeline milestones have been fulfilled. Contract deliverables, talent settlements, and invoices are archived.
                  </p>
                </div>

                {/* Final Master Video Delivery Link in Stage 7 (CRM ONLY) */}
                {(editingData.finalVideoUrl || demoData.finalVideoUrl) && (
                  <div style={{
                    width: '100%',
                    maxWidth: '840px',
                    marginTop: '12px',
                    padding: '16px 20px',
                    background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(3, 105, 161, 0.25) 100%)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: '28px' }}>movie_filter</span>
                      <div>
                        <strong style={{ fontSize: '14px', color: '#f8fafc', display: 'block' }}>
                          🎬 Final Master Video Delivery Link (Submitted by Editor)
                        </strong>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Archived Master Assets • Internal CRM Only</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(editingData.finalVideoUrl || demoData.finalVideoUrl || '');
                          showToast("Master Video URL copied to clipboard!");
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#e2e8f0',
                          fontWeight: 600,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                        Copy Link
                      </button>
                      <a
                        href={editingData.finalVideoUrl || demoData.finalVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '12px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                        Open Final Master Video ↗
                      </a>
                    </div>
                  </div>
                )}

                {/* ============================================================
                    INVOICE-TYPE FINANCIAL BREAKDOWN CARD
                    ============================================================ */}
                <div style={{
                  width: '100%',
                  maxWidth: '840px',
                  marginTop: '12px',
                  padding: '20px 24px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  backdropFilter: 'blur(16px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: '22px' }}>receipt_long</span>
                      <div>
                        <strong style={{ fontSize: '15px', color: '#f8fafc', display: 'block' }}>Commercial Invoice & Financial Ledger</strong>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Client: {project?.clientName || 'Commercial Partner'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsInvoiceModalOpen(true)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                      Download Official Tax Invoice / Receipt
                    </button>
                  </div>

                  {/* Financial Itemized Ledger Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Base Production Contract</span>
                      <strong style={{ fontSize: '14px', color: '#f8fafc', marginTop: '2px', display: 'block' }}>{formatCurrency(budget)}</strong>
                    </div>

                    <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Additional Revision Fees</span>
                      <strong style={{ fontSize: '14px', color: totalRevisionFees > 0 ? '#fbbf24' : '#94a3b8', marginTop: '2px', display: 'block' }}>
                        {totalRevisionFees > 0 ? `+${formatCurrency(totalRevisionFees)} (${billableRevisionsCount} rev)` : 'BDT 0 (Within Allowance)'}
                      </strong>
                    </div>

                    <div style={{ padding: '10px 14px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                      <span style={{ fontSize: '11px', color: '#38bdf8', display: 'block' }}>Total Invoiced Value</span>
                      <strong style={{ fontSize: '14px', color: '#38bdf8', marginTop: '2px', display: 'block' }}>{formatCurrency(effectiveBudget)}</strong>
                    </div>

                    <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <span style={{ fontSize: '11px', color: '#34d399', display: 'block' }}>Payments Collected</span>
                      <strong style={{ fontSize: '14px', color: '#34d399', marginTop: '2px', display: 'block' }}>{formatCurrency(totalReceived)}</strong>
                    </div>

                    <div style={{ padding: '10px 14px', background: clientDue > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: clientDue > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <span style={{ fontSize: '11px', color: clientDue > 0 ? '#f87171' : '#34d399', display: 'block' }}>Outstanding Client Due</span>
                      <strong style={{ fontSize: '14px', color: clientDue > 0 ? '#f87171' : '#34d399', marginTop: '2px', display: 'block' }}>
                        {clientDue > 0 ? formatCurrency(clientDue) : 'PAID & SETTLED ✓'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* ============================================================
                    TALENT & TEAM SETTLEMENTS GRID: MODEL & EDITOR
                    ============================================================ */}
                <div style={{ width: '100%', maxWidth: '840px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '12px', marginTop: '4px' }}>
                  {/* Model Talent Settlement Card */}
                  <div style={{
                    padding: '16px 20px',
                    background: 'rgba(236, 72, 153, 0.06)',
                    border: '1px solid rgba(236, 72, 153, 0.25)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#f472b6', fontSize: '20px' }}>face_3</span>
                        <div>
                          <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>Model Talent Settlement</strong>
                          <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                            {productData.assignedModelName || 'Sarah Miller - Elite Agency'}
                          </span>
                        </div>
                      </div>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: productData.modelPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: productData.modelPaid ? '#34d399' : '#fbbf24',
                        border: productData.modelPaid ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {productData.modelPaid ? '✓ PAID & SETTLED' : '⏳ PAYMENT DUE'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', fontSize: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        {isEditingModelRate ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>BDT:</span>
                            <input
                              type="number"
                              value={tempModelRate}
                              onChange={(e) => setTempModelRate(e.target.value)}
                              placeholder="Amount"
                              style={{
                                width: '90px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'rgba(0,0,0,0.5)',
                                border: '1px solid #f472b6',
                                color: '#f8fafc',
                                fontSize: '12px',
                                outline: 'none'
                              }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveCustomModelRate(tempModelRate);
                                if (e.key === 'Escape') setIsEditingModelRate(false);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCustomModelRate(tempModelRate)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: '#ec4899',
                                border: 'none',
                                color: '#fff',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              ✓ Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingModelRate(false)}
                              style={{
                                padding: '4px 6px',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: '#cbd5e1',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Agreed Model Rate:</span>
                            <strong style={{ color: '#f472b6', fontSize: '14px' }}>
                              {productData.modelRate ? formatCurrency(productData.modelRate) : 'BDT 1,000'}
                            </strong>
                            <button
                              type="button"
                              onClick={() => {
                                setTempModelRate(productData.modelRate || '1000');
                                setIsEditingModelRate(true);
                              }}
                              style={{
                                padding: '2px 7px',
                                borderRadius: '6px',
                                background: 'rgba(244, 114, 182, 0.15)',
                                border: '1px solid rgba(244, 114, 182, 0.35)',
                                color: '#f472b6',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                              title="Edit Model Rate"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>edit</span>
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleModelPaid}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          background: productData.modelPaid
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                          border: productData.modelPaid ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                          color: productData.modelPaid ? '#cbd5e1' : '#ffffff',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          {productData.modelPaid ? 'check_circle' : 'payments'}
                        </span>
                        {productData.modelPaid ? 'Paid (Click to Revert)' : 'Pay Model Fee ✓'}
                      </button>
                    </div>
                  </div>

                  {/* Editor Settlement & Performance Card */}
                  <div style={{
                    padding: '16px 20px',
                    background: 'rgba(99, 102, 241, 0.06)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#818cf8', fontSize: '20px' }}>badge</span>
                        <div>
                          <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>Lead Editor Settlement</strong>
                          <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                            {shootingData.assignedEditorName || 'Niam'}
                          </span>
                        </div>
                      </div>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: shootingData.editorPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: shootingData.editorPaid ? '#34d399' : '#fbbf24',
                        border: shootingData.editorPaid ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {shootingData.editorPaid ? '✓ PAID & SETTLED' : '⏳ PAYMENT DUE'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', fontSize: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        {isEditingEditorFee ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>BDT:</span>
                            <input
                              type="number"
                              value={tempEditorFee}
                              onChange={(e) => setTempEditorFee(e.target.value)}
                              placeholder="Amount"
                              style={{
                                width: '90px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'rgba(0,0,0,0.5)',
                                border: '1px solid #818cf8',
                                color: '#f8fafc',
                                fontSize: '12px',
                                outline: 'none'
                              }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveCustomEditorFee(tempEditorFee);
                                if (e.key === 'Escape') setIsEditingEditorFee(false);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCustomEditorFee(tempEditorFee)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: '#6366f1',
                                border: 'none',
                                color: '#fff',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              ✓ Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingEditorFee(false)}
                              style={{
                                padding: '4px 6px',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: '#cbd5e1',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Editor Payment:</span>
                            <strong style={{ color: '#818cf8', fontSize: '14px' }}>
                              {shootingData.editorFee ? formatCurrency(shootingData.editorFee) : (projectBasedStaff.find((pe: any) => pe.employeeId === shootingData.assignedEditorId)?.rate ? formatCurrency(projectBasedStaff.find((pe: any) => pe.employeeId === shootingData.assignedEditorId)?.rate) : 'BDT 1,500')}
                            </strong>
                            <button
                              type="button"
                              onClick={() => {
                                const currentFee = shootingData.editorFee || (projectBasedStaff.find((pe: any) => pe.employeeId === shootingData.assignedEditorId)?.rate ? String(projectBasedStaff.find((pe: any) => pe.employeeId === shootingData.assignedEditorId)?.rate) : '1500');
                                setTempEditorFee(currentFee);
                                setIsEditingEditorFee(true);
                              }}
                              style={{
                                padding: '2px 7px',
                                borderRadius: '6px',
                                background: 'rgba(129, 140, 248, 0.15)',
                                border: '1px solid rgba(129, 140, 248, 0.35)',
                                color: '#818cf8',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                              title="Edit Editor Fee"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>edit</span>
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={handleToggleEditorPaid}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: shootingData.editorPaid
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            border: shootingData.editorPaid ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                            color: shootingData.editorPaid ? '#cbd5e1' : '#ffffff',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            {shootingData.editorPaid ? 'check_circle' : 'payments'}
                          </span>
                          {shootingData.editorPaid ? 'Paid' : 'Pay Editor ✓'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (editorRating) {
                              setEditorRatingValue(editorRating.rating || 5);
                              setEditorRatingFeedbackText(editorRating.feedback || '');
                            }
                            setIsRateEditorModalOpen(true);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            color: '#c7d2fe',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fbbf24' }}>star</span>
                          {editorRating ? `Rated ${editorRating.rating}/5` : 'Rate'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Portal Submitted Rating & Review Card */}
                {clientReview && (
                  <div style={{
                    width: '100%',
                    maxWidth: '840px',
                    marginTop: '4px',
                    padding: '16px 20px',
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', color: '#fbbf24' }}>
                          {'★'.repeat(clientReview.rating || 5)}{'☆'.repeat(5 - (clientReview.rating || 5))}
                        </span>
                        <strong style={{ fontSize: '13px', color: '#fbbf24' }}>
                          Client Review ({clientReview.rating || 5}/5 Stars)
                        </strong>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {clientReview.submittedAt ? new Date(clientReview.submittedAt).toLocaleDateString() : 'Received'}
                      </span>
                    </div>
                    {clientReview.reviewText && (
                      <p style={{ margin: 0, fontSize: '13px', color: '#f8fafc', fontStyle: 'italic' }}>
                        "{clientReview.reviewText}"
                      </p>
                    )}
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Submitted by: {clientReview.clientName || project?.clientName || 'Client'}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={styles.celebrationActions} style={{ width: '100%', maxWidth: '840px', display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsInvoiceModalOpen(true)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
                    Download Invoice
                  </button>

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
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      borderColor: '#ef4444',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      {isDeletingProject ? 'hourglass_empty' : 'delete_forever'}
                    </span>
                    {isDeletingProject ? 'Deleting Project...' : 'Permanently Delete Project'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL: SHORT LINKS & LIVE TRACKER SHARING (CUSTOMER & EDITOR)
            ==================================================================== */}
        {isShareModalOpen && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsShareModalOpen(false); }}>
            <div className={styles.modalContent} style={{ maxWidth: '560px' }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  <span className="material-symbols-outlined" style={{ color: shareModalTab === 'customer' ? '#a855f7' : '#6366f1', fontSize: '22px' }}>
                    {shareModalTab === 'customer' ? 'share' : 'badge'}
                  </span>
                  Share Live Tracking Links
                </h3>
                <button onClick={() => setIsShareModalOpen(false)} className={styles.closeBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>

              {/* Tab Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShareModalTab('customer')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: shareModalTab === 'customer' ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' : 'transparent',
                    color: shareModalTab === 'customer' ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                  Customer Link (/p/{projectId.slice(0, 8)}...)
                </button>

                <button
                  type="button"
                  onClick={() => setShareModalTab('editor')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: shareModalTab === 'editor' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
                    color: shareModalTab === 'editor' ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>movie_edit</span>
                  Editor Link (/e/{projectId.slice(0, 8)}...)
                </button>
              </div>

              {/* CUSTOMER TAB CONTENT */}
              {shareModalTab === 'customer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '6px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                    Send this short tracking link to <strong>{project?.clientName || 'your customer'}</strong>. They can view real-time production status, product inspection, financials, assigned talent & editor, download official invoices, submit demo revisions, and leave reviews without needing to login.
                  </p>

                  {/* Stage Lifecycle Notice */}
                  {currentStage < 3 && (
                    <div style={{
                      padding: '10px 12px',
                      background: 'rgba(234, 179, 8, 0.1)',
                      border: '1px solid rgba(234, 179, 8, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#facc15'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
                      <span>
                        <strong>Portal Active from Stage 3:</strong> Project is currently in <strong>Stage {currentStage}: {stageNames[currentStage]}</strong>. Visitors opening this link will see the preparation mode until Creative & Scripting begins.
                      </span>
                    </div>
                  )}

                  {currentStage >= 7 && (
                    <div style={{
                      padding: '10px 12px',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#4ade80'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                      <span>
                        <strong>Project Completed:</strong> Project is delivered and archived. Customer active lifecycle is complete.
                      </span>
                    </div>
                  )}

                  {currentStage >= 3 && currentStage < 7 && (
                    <div style={{
                      padding: '10px 12px',
                      background: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#d8b4fe'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>rocket_launch</span>
                      <span>
                        <strong>Customer Portal Active:</strong> Tracking is live for <strong>Stage {currentStage}: {stageNames[currentStage]}</strong>. Revisions & demo reviews are accessible.
                      </span>
                    </div>
                  )}

                  {/* Customer URL Box */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#0f172a',
                    border: '1px solid #a855f7',
                    borderRadius: '12px',
                    padding: '6px 8px 6px 14px',
                    gap: '8px'
                  }}>
                    <span className="material-symbols-outlined" style={{ color: '#a855f7', fontSize: '18px' }}>link</span>
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/p/${projectId}` : `/p/${projectId}`}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: '#f8fafc',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/p/${projectId}`;
                        navigator.clipboard.writeText(url);
                        showToast("🎉 Customer Short Link copied to clipboard!");
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        background: '#a855f7',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                      Copy Link
                    </button>
                  </div>

                  {/* Customer Quick Share Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/p/${projectId}`;
                        const msg = `Hello ${project?.clientName || ''}, here is the live tracking link for your project "${project?.name}": ${url}`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(37, 211, 102, 0.15)',
                        border: '1px solid rgba(37, 211, 102, 0.4)',
                        color: '#25d366',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span>
                      Share via WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/p/${projectId}`;
                        const subject = `Live Project Tracker: ${project?.name}`;
                        const body = `Dear ${project?.clientName || 'Client'},\n\nYou can track the live progress, invoices, shooting schedule, and demo cuts for your project here:\n${url}\n\nBest regards,\nProduction Team`;
                        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#60a5fa',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>mail</span>
                      Share via Email
                    </button>
                  </div>

                  {/* Preview Customer View */}
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>Current Client View</strong>
                      <span style={{ fontSize: '11px', color: '#38bdf8' }}>
                        Stage {currentStage}: {stageNames[currentStage]} active
                      </span>
                    </div>
                    <a
                      href={`/portal/project/${projectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(168, 85, 247, 0.2)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        color: '#c084fc',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Open Portal View ↗
                    </a>
                  </div>
                </div>
              )}

              {/* EDITOR TAB CONTENT */}
              {shareModalTab === 'editor' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '6px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                    Send this dedicated workspace link to <strong>{shootingData.assignedEditorName || 'your assigned editor'}</strong>. They can view the shoot log, format specs, open cloud assets (Frame.io/Dropbox), submit completed demo cuts, and view real-time client revision requests.
                  </p>

                  {/* Editor URL Box */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#0f172a',
                    border: '1px solid #6366f1',
                    borderRadius: '12px',
                    padding: '6px 8px 6px 14px',
                    gap: '8px'
                  }}>
                    <span className="material-symbols-outlined" style={{ color: '#6366f1', fontSize: '18px' }}>link</span>
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/e/${projectId}` : `/e/${projectId}`}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: '#f8fafc',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/e/${projectId}`;
                        navigator.clipboard.writeText(url);
                        showToast("🎬 Editor Short Link copied to clipboard!");
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        background: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                      Copy Link
                    </button>
                  </div>

                  {/* Editor Quick Share Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/e/${projectId}`;
                        const msg = `Hi ${shootingData.assignedEditorName || 'Editor'}, here is your project workspace link for "${project?.name}": ${url}\nYou can access raw footage links, specs, submit demo cuts, and view client revisions here.`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(37, 211, 102, 0.15)',
                        border: '1px solid rgba(37, 211, 102, 0.4)',
                        color: '#25d366',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span>
                      Send to Editor via WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/e/${projectId}`;
                        const subject = `Post-Production Workspace: ${project?.name}`;
                        const body = `Hi ${shootingData.assignedEditorName || 'Editor'},\n\nHere is your dedicated production link for "${project?.name}":\n${url}\n\nPlease review instructions, deliverable formats, and upload completed cuts.\n\nBest regards,\nStudio Production Team`;
                        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: '#818cf8',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>mail</span>
                      Email to Editor
                    </button>
                  </div>

                  {/* Preview Editor View */}
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>Editor Live Portal</strong>
                      <span style={{ fontSize: '11px', color: '#a5b4fc' }}>
                        Assigned: {shootingData.assignedEditorName || 'Team Editor'}
                      </span>
                    </div>
                    <a
                      href={`/portal/editor/${projectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: '#a5b4fc',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Open Editor Portal ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL: RATE ASSIGNED EDITOR PERFORMANCE
            ==================================================================== */}
        {isRateEditorModalOpen && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsRateEditorModalOpen(false); }}>
            <div className={styles.modalContent} style={{ maxWidth: '480px' }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>star</span>
                  Rate Editor Performance
                </h3>
                <button onClick={() => setIsRateEditorModalOpen(false)} className={styles.closeBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>

              <form onSubmit={handleSaveEditorRating} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Record performance score and feedback for <strong style={{ color: '#f8fafc' }}>{shootingData.assignedEditorName || 'assigned editor'}</strong>.
                </p>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Performance Rating ({editorRatingValue}/5 Stars)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditorRatingValue(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '28px',
                          color: star <= editorRatingValue ? '#fbbf24' : '#475569',
                          cursor: 'pointer',
                          padding: '0 4px',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                    Feedback & Work Quality Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Excellent color grading speed, followed client notes accurately and delivered before deadline."
                    value={editorRatingFeedbackText}
                    onChange={(e) => setEditorRatingFeedbackText(e.target.value)}
                    className={styles.inputField}
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setIsRateEditorModalOpen(false)}
                    className={styles.backBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEditorRating}
                    className={styles.submitBtn}
                    style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: '#0f172a', fontWeight: 800 }}
                  >
                    {isSubmittingEditorRating ? 'Saving...' : 'Save Rating ✓'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL: OFFICIAL PROJECT TAX INVOICE & RECEIPT
            ==================================================================== */}
        {isInvoiceModalOpen && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsInvoiceModalOpen(false); }}>
            <div className={styles.modalContent} style={{ maxWidth: '680px', background: '#ffffff', color: '#0f172a', borderRadius: '16px', padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              {/* Invoice Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#2563eb' }}>receipt_long</span>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#0f172a' }}>OFFICIAL INVOICE</h2>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    Invoice #{project?.projectCode || project?.id?.substring(0, 8).toUpperCase()}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Shohoj Ledger Studio</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Client & Project Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '20px 0' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Billed To</span>
                  <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a', marginTop: '4px' }}>
                    {project?.clientName || 'Client / Commercial Partner'}
                  </strong>
                  {project?.clientPhone && (
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Phone: {project.clientPhone}
                    </span>
                  )}
                </div>

                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Project Reference</span>
                  <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a', marginTop: '4px' }}>
                    {project?.name}
                  </strong>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Status: {project?.status || 'Completed'} (Stage 7 Final Delivery)
                  </span>
                </div>
              </div>

              {/* Line Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '12px', color: '#475569' }}>Description</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '12px', color: '#475569' }}>Quantity / Scope</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12px', color: '#475569' }}>Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ color: '#0f172a' }}>Commercial Media Production & Shoot</strong>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {productData.productName ? `Intake: ${productData.productName}` : 'Product photography, video shoot & post-production'}
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: '#475569' }}>1 Project Scope</td>
                    <td style={{ textAlign: 'right', padding: '12px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(budget)}</td>
                  </tr>

                  {totalRevisionFees > 0 && (
                    <tr style={{ background: '#fefce8', borderBottom: '1px solid #fef08a' }}>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ color: '#854d0e' }}>Additional Revision Fees ({billableRevisionsCount} rounds)</strong>
                        <div style={{ fontSize: '11px', color: '#a16207', marginTop: '2px' }}>
                          Client revision rounds beyond {demoData.freeRevisionsIncluded ?? 2} free allowance (@ {formatCurrency(demoData.costPerRevision ?? 1000)}/round)
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: '#854d0e' }}>{billableRevisionsCount} Extra Rounds</td>
                      <td style={{ textAlign: 'right', padding: '12px', fontWeight: 700, color: '#854d0e' }}>
                        +{formatCurrency(totalRevisionFees)}
                      </td>
                    </tr>
                  )}

                  {payments && payments.length > 0 && (
                    payments.map((p: any, i: number) => (
                      <tr key={p.id || i} style={{ background: '#f0fdf4', borderBottom: '1px solid #dcfce7' }}>
                        <td style={{ padding: '10px 12px', color: '#16a34a' }}>
                          ✓ Payment Received ({p.paymentMethod || 'Bank'}) {p.notes ? `- ${p.notes}` : ''}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#16a34a', fontSize: '11px' }}>{new Date(p.createdAt || Date.now()).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right', padding: '10px 12px', color: '#16a34a', fontWeight: 700 }}>
                          -{formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Totals Box */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', margin: '16px 0', borderTop: '2px solid #e2e8f0', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '280px', fontSize: '13px', color: '#475569' }}>
                  <span>Base Contract Total:</span>
                  <strong>{formatCurrency(budget)}</strong>
                </div>
                {totalRevisionFees > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '280px', fontSize: '13px', color: '#854d0e' }}>
                    <span>Revision Surcharges:</span>
                    <strong>+{formatCurrency(totalRevisionFees)}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '280px', fontSize: '13px', color: '#16a34a' }}>
                  <span>Total Paid / Advance:</span>
                  <strong>-{formatCurrency(totalReceived)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '280px', fontSize: '16px', fontWeight: 800, color: clientDue > 0 ? '#dc2626' : '#16a34a', borderTop: '2px solid #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Outstanding Due:</span>
                  <span>{clientDue > 0 ? formatCurrency(clientDue) : 'PAID & SETTLED (BDT 0)'}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '10px', background: '#e2e8f0', border: 'none', color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ padding: '10px 22px', borderRadius: '10px', background: '#2563eb', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
                  Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
