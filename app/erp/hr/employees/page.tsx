"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './employees.module.css';

interface Employee {
  id: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  departmentId?: string | null;
  designationId?: string | null;
  basicSalary?: number | string;
  employmentType?: string;
  status?: string;
  joinDate?: string;
  shift?: string | null;
  workShiftId?: string | null;
  workShift?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    gracePeriod: number;
    breakTime: number;
    nightShift: boolean;
  } | null;
  departmentRef?: { id?: string; name: string };
  designationRef?: { id?: string; name: string };
  profile?: {
    photo?: string | null;
  } | null;
  photo?: string | null;
  avatar?: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface Designation {
  id: string;
  name: string;
}

/**
 * ERP HR — Redesigned Employee Directory & Workforce Hub
 * Enterprise directory with live metrics, multi-dimensional filters,
 * dual Table/Card view modes, CSV roster export, and empty state CTA.
 */
export default function EmployeesPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedDesig, setSelectedDesig] = useState('ALL');
  const [compensationFilter, setCompensationFilter] = useState<'ALL' | 'SALARY' | 'PROJECT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [onboardingMode, setOnboardingMode] = useState<'BASIC' | 'PROFESSIONAL'>('PROFESSIONAL');
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Employee Details Modal State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'about' | 'availability' | 'experience' | 'payroll'>('about');
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleRowClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setModalActiveTab('about');
    setIsBioExpanded(false);
  };

  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  // Edit Profile Modal State
  const [editModalEmployee, setEditModalEmployee] = useState<Employee | null>(null);
  const [editPhoto, setEditPhoto] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editDesignationId, setEditDesignationId] = useState('');
  const [editIsCustomDesig, setEditIsCustomDesig] = useState(false);
  const [editDepartment, setEditDepartment] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editIsCustomDept, setEditIsCustomDept] = useState(false);
  const [editBasicSalary, setEditBasicSalary] = useState<string | number>('');
  const [editEmploymentType, setEditEmploymentType] = useState('Full-Time');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenEditModal = (emp: Employee) => {
    setEditModalEmployee(emp);
    setEditPhoto(emp.profile?.photo || emp.photo || emp.avatar || '');
    setEditFirstName(emp.firstName || '');
    setEditLastName(emp.lastName || '');
    setEditEmail(emp.email || '');
    setEditPhone(emp.phone || '');

    const currentDesig = emp.designationRef?.name || emp.designation || '';
    setEditDesignation(currentDesig);
    setEditDesignationId(emp.designationId || emp.designationRef?.id || '');
    setEditIsCustomDesig(false);

    const currentDept = emp.departmentRef?.name || emp.department || '';
    setEditDepartment(currentDept);
    setEditDepartmentId(emp.departmentId || emp.departmentRef?.id || '');
    setEditIsCustomDept(false);

    setEditBasicSalary(emp.basicSalary ?? '');
    setEditEmploymentType(emp.employmentType || 'Full-Time');
    setEditStatus(emp.status || 'ACTIVE');
    setEditFeedback(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setEditFeedback({ type: 'error', message: 'Image file size must be less than 5MB' });
      return;
    }

    setIsUploadingPhoto(true);
    setEditFeedback(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.fileUrl) {
        throw new Error(data.error || 'Failed to upload photo');
      }
      setEditPhoto(data.fileUrl);
      setEditFeedback({ type: 'success', message: 'Profile photo uploaded!' });
    } catch (err: any) {
      setEditFeedback({ type: 'error', message: err.message || 'Error uploading photo' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editModalEmployee) return;
    setIsSavingEdit(true);
    setEditFeedback(null);
    try {
      const res = await fetch(`/api/employees/${editModalEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editFirstName,
          lastName: editLastName,
          email: editEmail,
          phone: editPhone,
          designation: editDesignation,
          designationId: editDesignationId || undefined,
          department: editDepartment,
          departmentId: editDepartmentId || undefined,
          basicSalary: Number(editBasicSalary) || 0,
          employmentType: editEmploymentType,
          status: editStatus,
          photo: editPhoto,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update employee profile.');
      }

      const updatedEmpData: Partial<Employee> = {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        phone: editPhone,
        designation: editDesignation,
        department: editDepartment,
        departmentRef: data.departmentRef || (editDepartment ? { id: data.departmentId || editDepartmentId, name: editDepartment } : undefined),
        designationRef: data.designationRef || (editDesignation ? { id: data.designationId || editDesignationId, name: editDesignation } : undefined),
        basicSalary: Number(editBasicSalary) || 0,
        employmentType: editEmploymentType,
        status: editStatus,
        profile: {
          photo: editPhoto,
        },
        photo: editPhoto,
      };

      setEmployees(prev =>
        prev.map(e => (e.id === editModalEmployee.id ? { ...e, ...updatedEmpData } : e))
      );

      if (selectedEmployee?.id === editModalEmployee.id) {
        setSelectedEmployee(prev => (prev ? { ...prev, ...updatedEmpData } : null));
      }

      setEditFeedback({ type: 'success', message: 'Employee profile updated successfully!' });
      setTimeout(() => {
        setEditModalEmployee(null);
        setEditFeedback(null);
      }, 1000);
    } catch (err: any) {
      setEditFeedback({ type: 'error', message: err.message || 'Error updating employee profile' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Custom Duty Modal State
  const [dutyModalEmployee, setDutyModalEmployee] = useState<Employee | null>(null);
  const [dutyStartTime, setDutyStartTime] = useState('09:30');
  const [dutyEndTime, setDutyEndTime] = useState('18:00');
  const [dutyGracePeriod, setDutyGracePeriod] = useState(15);
  const [dutyBreakTime, setDutyBreakTime] = useState(60);
  const [dutyNightShift, setDutyNightShift] = useState(false);
  const [isSavingDuty, setIsSavingDuty] = useState(false);
  const [dutyFeedback, setDutyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenCustomDuty = (emp: Employee) => {
    setDutyModalEmployee(emp);
    setDutyFeedback(null);
    if (emp.workShift) {
      setDutyStartTime(emp.workShift.startTime || '09:30');
      setDutyEndTime(emp.workShift.endTime || '18:00');
      setDutyGracePeriod(emp.workShift.gracePeriod ?? 15);
      setDutyBreakTime(emp.workShift.breakTime ?? 60);
      setDutyNightShift(!!emp.workShift.nightShift);
    } else {
      setDutyStartTime('09:30');
      setDutyEndTime('18:00');
      setDutyGracePeriod(15);
      setDutyBreakTime(60);
      setDutyNightShift(false);
    }
  };

  const handleSaveCustomDuty = async () => {
    if (!dutyModalEmployee) return;
    setIsSavingDuty(true);
    setDutyFeedback(null);
    try {
      const res = await fetch(`/api/employees/${dutyModalEmployee.id}/custom-duty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: dutyStartTime,
          endTime: dutyEndTime,
          gracePeriod: Number(dutyGracePeriod) || 0,
          breakTime: Number(dutyBreakTime) || 0,
          nightShift: dutyNightShift,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save custom duty schedule.');
      }
      setEmployees(prev =>
        prev.map(e =>
          e.id === dutyModalEmployee.id
            ? {
                ...e,
                workShiftId: data.customDuty?.id || e.workShiftId,
                workShift: data.customDuty,
                shift: `${dutyStartTime} - ${dutyEndTime}`,
              }
            : e
        )
      );
      setDutyFeedback({ type: 'success', message: 'Custom duty schedule saved successfully!' });
      setTimeout(() => {
        setDutyModalEmployee(null);
        setDutyFeedback(null);
      }, 1200);
    } catch (err: any) {
      setDutyFeedback({ type: 'error', message: err.message || 'Error saving custom duty' });
    } finally {
      setIsSavingDuty(false);
    }
  };

  const handleResetCustomDuty = async () => {
    if (!dutyModalEmployee) return;
    if (!confirm('Are you sure you want to reset this employee to the company default shift?')) return;
    setIsSavingDuty(true);
    setDutyFeedback(null);
    try {
      const res = await fetch(`/api/employees/${dutyModalEmployee.id}/custom-duty`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset custom duty.');
      }
      setEmployees(prev =>
        prev.map(e =>
          e.id === dutyModalEmployee.id
            ? {
                ...e,
                workShiftId: null,
                workShift: null,
                shift: null,
              }
            : e
        )
      );
      setDutyFeedback({ type: 'success', message: 'Reset to company default shift.' });
      setTimeout(() => {
        setDutyModalEmployee(null);
        setDutyFeedback(null);
      }, 1000);
    } catch (err: any) {
      setDutyFeedback({ type: 'error', message: err.message || 'Error resetting duty' });
    } finally {
      setIsSavingDuty(false);
    }
  };

  const loadAll = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    else setIsLoading(true);

    try {
      const [empRes, deptRes, desigRes, onboardingRes] = await Promise.all([
        fetch('/api/employees').catch(() => null),
        fetch('/api/departments').catch(() => null),
        fetch('/api/designations').catch(() => null),
        fetch('/api/settings/onboarding').catch(() => null),
      ]);

      if (empRes && empRes.ok) {
        const empData = await empRes.json();
        setEmployees(Array.isArray(empData) ? empData : []);
      }
      if (deptRes && deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(Array.isArray(deptData) ? deptData : []);
      }
      if (desigRes && desigRes.ok) {
        const desigData = await desigRes.json();
        setDesignations(Array.isArray(desigData) ? desigData : []);
      }
      if (onboardingRes && onboardingRes.ok) {
        const onboardingData = await onboardingRes.json();
        if (onboardingData?.mode) {
          setOnboardingMode(onboardingData.mode);
        }
      }

      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed to load employee directory:', e);
    } finally {
      setIsLoading(false);
      if (isManual) setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Instant Switcher for Onboarding Mode
  const handleToggleOnboardingMode = async () => {
    const newMode = onboardingMode === 'BASIC' ? 'PROFESSIONAL' : 'BASIC';
    setOnboardingMode(newMode);
    try {
      await fetch('/api/settings/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });
    } catch (e) {
      console.error('Failed to sync onboarding mode', e);
    }
  };

  // Format currency helper
  const formatCurrency = (val?: number | string | null) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  // Handle delete employee confirmed
  const handleConfirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    setDeletingId(employeeToDelete.id);
    try {
      const res = await fetch(`/api/employees/${employeeToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEmployees(prev => prev.filter(e => e.id !== employeeToDelete.id));
        setEmployeeToDelete(null);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Failed to delete employee');
      }
    } catch (err: any) {
      alert('Network error deleting employee: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Derived KPI calculations
  const totalCount = employees.length;
  const activeCount = employees.filter(e => (e.status || 'ACTIVE') === 'ACTIVE').length;
  const onLeaveCount = employees.filter(e => e.status === 'ON_LEAVE').length;
  const terminatedCount = employees.filter(e => e.status === 'TERMINATED').length;


  // Multi-dimensional filtering
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search
      const searchTarget = `${emp.firstName} ${emp.lastName} ${emp.email} ${emp.employeeId || ''} ${emp.department || ''} ${emp.designation || ''}`.toLowerCase();
      const matchesSearch = !search || searchTarget.includes(search.toLowerCase());

      // Department filter
      const deptName = emp.departmentRef?.name || emp.department || '';
      const matchesDept = selectedDept === 'ALL' || deptName === selectedDept;

      // Designation filter
      const desigName = emp.designationRef?.name || emp.designation || '';
      const matchesDesig = selectedDesig === 'ALL' || desigName === selectedDesig;

      // Compensation filter
      const isProject = emp.employmentType === 'Project-Based';
      const matchesComp =
        compensationFilter === 'ALL' ||
        (compensationFilter === 'PROJECT' && isProject) ||
        (compensationFilter === 'SALARY' && !isProject);

      // Status filter
      const empStatus = emp.status || 'ACTIVE';
      const matchesStatus = statusFilter === 'ALL' || empStatus === statusFilter;

      return matchesSearch && matchesDept && matchesDesig && matchesComp && matchesStatus;
    });
  }, [employees, search, selectedDept, selectedDesig, compensationFilter, statusFilter]);

  // CSV Export
  const handleExportCSV = () => {
    if (employees.length === 0) return;
    const headers = [
      'Employee ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'Basic Salary',
      'Status',
      'Join Date',
    ];
    const rows = filteredEmployees.map(e => [
      e.employeeId || '',
      e.firstName || '',
      e.lastName || '',
      e.email || '',
      e.phone || '',
      e.departmentRef?.name || e.department || '',
      e.designationRef?.name || e.designation || '',
      e.basicSalary || '',
      e.status || 'ACTIVE',
      e.joinDate ? new Date(e.joinDate).toLocaleDateString() : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employee_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'ON_LEAVE':
        return styles.statusLeave;
      case 'TERMINATED':
        return styles.statusTerminated;
      default:
        return styles.statusActive;
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Minimal Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            Employee Directory &amp; Workforce
            <span className={styles.titleBadge}>{totalCount} Registered</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          {/* Data Intake Mode Indicator / Settings Link */}
          <Link
            href="/erp/settings/onboarding"
            className={styles.headerIconBtn}
            title={`Data Intake: ${onboardingMode === 'BASIC' ? 'Basic Mode (7 Fields)' : 'Professional Mode (Enterprise Dossier)'} - Click to configure`}
            aria-label="Configure Data Intake Mode"
            style={{
              background: onboardingMode === 'BASIC' ? 'rgba(245, 158, 11, 0.14)' : 'rgba(37, 99, 235, 0.14)',
              color: onboardingMode === 'BASIC' ? '#f59e0b' : '#2563eb',
              borderColor: onboardingMode === 'BASIC' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(37, 99, 235, 0.35)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {onboardingMode === 'BASIC' ? 'bolt' : 'workspace_premium'}
            </span>
          </Link>

          <button
            onClick={handleExportCSV}
            className={styles.headerIconBtn}
            disabled={employees.length === 0}
            title="Export CSV Roster"
            aria-label="Export CSV Roster"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
          </button>

          <button
            onClick={() => loadAll(true)}
            className={styles.headerIconBtn}
            disabled={isSyncing}
            title="Refresh Employee Data"
            aria-label="Refresh Employee Data"
          >
            <span
              className={`material-symbols-outlined ${isSyncing ? styles.spinning : ''}`}
              style={{ fontSize: '20px' }}
            >
              refresh
            </span>
          </button>

          <Link
            href="/erp/hr/employees/new"
            className={`${styles.headerIconBtn} ${styles.headerIconBtnPrimary}`}
            title={`Add Employee (${onboardingMode === 'BASIC' ? 'Basic' : 'Pro'})`}
            aria-label={`Add Employee (${onboardingMode === 'BASIC' ? 'Basic' : 'Pro'})`}
            style={{
              background: onboardingMode === 'BASIC'
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: onboardingMode === 'BASIC'
                ? '0 4px 14px rgba(245, 158, 11, 0.35)'
                : '0 4px 14px rgba(37, 99, 235, 0.35)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {onboardingMode === 'BASIC' ? 'bolt' : 'person_add'}
            </span>
          </Link>
        </div>
      </header>


      {/* 3. Filter & Controls Bar */}
      <section className={styles.controlsCard}>
        <div className={styles.controlsTopRow}>
          {/* Search Box */}
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input
              type="text"
              placeholder="Search by name, email, employee ID, designation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} className={styles.clearSearchBtn} title="Clear search">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
          </div>

          {/* Filter Selects */}
          <div className={styles.filterSelectsGroup}>
            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className={styles.selectDropdown}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Designation Filter */}
            <select
              value={selectedDesig}
              onChange={e => setSelectedDesig(e.target.value)}
              className={styles.selectDropdown}
            >
              <option value="ALL">All Designations</option>
              {designations.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Compensation Type Filter */}
            <select
              value={compensationFilter}
              onChange={e => setCompensationFilter(e.target.value as any)}
              className={styles.selectDropdown}
            >
              <option value="ALL">All Payment Types</option>
              <option value="SALARY">Monthly Salaried Only</option>
              <option value="PROJECT">Project-Based Only</option>
            </select>
          </div>
        </div>

        <div className={styles.controlsBottomRow}>
          {/* Status Tabs */}
          <div className={styles.statusTabsList}>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`${styles.statusTabBtn} ${statusFilter === 'ALL' ? styles.statusTabBtnActive : ''}`}
            >
              All Staff
              <span style={{ opacity: 0.7 }}>({totalCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`${styles.statusTabBtn} ${statusFilter === 'ACTIVE' ? styles.statusTabBtnActive : ''}`}
            >
              Active
              <span style={{ opacity: 0.7 }}>({activeCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ON_LEAVE')}
              className={`${styles.statusTabBtn} ${statusFilter === 'ON_LEAVE' ? styles.statusTabBtnActive : ''}`}
            >
              On Leave
              <span style={{ opacity: 0.7 }}>({onLeaveCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('TERMINATED')}
              className={`${styles.statusTabBtn} ${statusFilter === 'TERMINATED' ? styles.statusTabBtnActive : ''}`}
            >
              Terminated
              <span style={{ opacity: 0.7 }}>({terminatedCount})</span>
            </button>
          </div>

          {/* View Switcher */}
          <div className={styles.viewToggleGroup}>
            <button
              onClick={() => setViewMode('table')}
              className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
              title="Table View"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>table_rows</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
              title="Card Grid View"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grid_view</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Main Data Presentation: Table vs Grid vs Empty State */}
      {isLoading ? (
        <div className={styles.tableCard} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={styles.skeleton} style={{ height: '54px', borderRadius: '12px' }} />
            ))}
          </div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className={styles.emptyStateBox}>
          <div className={styles.emptyStateIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              {search || selectedDept !== 'ALL' || selectedDesig !== 'ALL' || statusFilter !== 'ALL'
                ? 'person_search'
                : 'badge'}
            </span>
          </div>

          {search || selectedDept !== 'ALL' || selectedDesig !== 'ALL' || statusFilter !== 'ALL' ? (
            <>
              <h3 className={styles.emptyStateTitle}>No Matching Employees Found</h3>
              <p className={styles.emptyStateDesc}>
                No staff members matched your current filter criteria. Try adjusting your search keywords or clearing active filters.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedDept('ALL');
                  setSelectedDesig('ALL');
                  setStatusFilter('ALL');
                }}
                className={styles.secondaryBtn}
                style={{ marginTop: '6px' }}
              >
                Clear All Filters
              </button>
            </>
          ) : (
            <>
              <h3 className={styles.emptyStateTitle}>No Employees Registered Yet</h3>
              <p className={styles.emptyStateDesc}>
                Your organization roster is currently empty. Add your first team member to start managing assignments, tracking daily attendance, and automating payroll runs.
              </p>
              <Link href="/erp/hr/employees/new" className={styles.primaryBtn} style={{ marginTop: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                Add Your First Employee
              </Link>
            </>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className={styles.tableCard}>
          <table className={styles.dataTable}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.tableHeaderCell}>Staff Member</th>
                <th className={styles.tableHeaderCell}>Department</th>
                <th className={styles.tableHeaderCell}>Designation</th>
                <th className={styles.tableHeaderCell}>Basic Salary</th>
                <th className={styles.tableHeaderCell}>Joined Date</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => {
                const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase() || 'EM';
                const deptName = emp.departmentRef?.name || emp.department || 'Unassigned';
                const desigName = emp.designationRef?.name || emp.designation || 'Staff';
                const status = emp.status || 'ACTIVE';

                return (
                  <tr
                    key={emp.id}
                    className={styles.tableRow}
                    onClick={() => handleRowClick(emp)}
                  >
                    <td className={styles.tableCell}>
                      <div className={styles.employeeProfileGroup}>
                        <div className={styles.empAvatar} style={{ overflow: 'hidden' }}>
                          {emp.profile?.photo || emp.photo || emp.avatar ? (
                            <img
                              src={emp.profile?.photo || emp.photo || emp.avatar || ''}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div>
                          <div className={styles.empName}>
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className={styles.empContact}>{emp.email}</div>
                          {emp.employeeId && (
                            <span className={styles.empIdBadge}>{emp.employeeId}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className={styles.tableCell}>
                      <span className={styles.deptPill}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>
                          corporate_fare
                        </span>
                        {deptName}
                      </span>
                    </td>

                    <td className={styles.tableCell}>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{desigName}</span>
                    </td>

                    <td className={styles.tableCell}>
                      {emp.employmentType === 'Project-Based' ? (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: 'rgba(139, 92, 246, 0.12)',
                            color: '#8b5cf6',
                            border: '1px solid rgba(139, 92, 246, 0.25)',
                            width: 'fit-content'
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>folder_special</span>
                            Project-Based
                          </span>
                          {Number(emp.basicSalary) > 0 && (
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              {formatCurrency(emp.basicSalary || 0)} / proj
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={styles.salaryText}>
                          {formatCurrency(emp.basicSalary || 0)}
                        </span>
                      )}
                    </td>

                    <td className={styles.tableCell}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : '—'}
                      </span>
                    </td>

                    <td className={styles.tableCell}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px' }}>
                        <span className={`${styles.statusChip} ${getStatusClass(status)}`}>
                          {status}
                        </span>
                        {emp.workShift && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            color: '#10b981',
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            width: 'fit-content'
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>schedule</span>
                            {emp.workShift.startTime} - {emp.workShift.endTime}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className={styles.tableCell} style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenCustomDuty(emp)}
                          title="Set Custom Duty Time"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            background: emp.workShift ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                            color: emp.workShift ? '#10b981' : '#6366f1',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: `1px solid ${emp.workShift ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            {emp.workShift ? 'schedule' : 'more_time'}
                          </span>
                          Custom Duty
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(emp);
                          }}
                          title="Edit Profile"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            background: 'rgba(37, 99, 235, 0.08)',
                            color: 'var(--primary)',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: '1px solid rgba(37, 99, 235, 0.2)',
                            cursor: 'pointer'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span>
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmployeeToDelete(emp);
                          }}
                          title="Delete Employee"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            cursor: 'pointer'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid / Card View */
        <div className={styles.cardsGrid}>
          {filteredEmployees.map(emp => {
            const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase() || 'EM';
            const deptName = emp.departmentRef?.name || emp.department || 'Unassigned';
            const desigName = emp.designationRef?.name || emp.designation || 'Staff';
            const status = emp.status || 'ACTIVE';

            return (
              <div
                key={emp.id}
                className={styles.employeeCard}
                onClick={() => handleRowClick(emp)}
              >
                <div className={styles.cardTopRow}>
                  <div className={styles.employeeProfileGroup}>
                    <div className={styles.empAvatar} style={{ overflow: 'hidden' }}>
                      {emp.profile?.photo || emp.photo || emp.avatar ? (
                        <img
                          src={emp.profile?.photo || emp.photo || emp.avatar || ''}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className={styles.cardMainInfo}>
                      <span className={styles.empName}>{emp.firstName} {emp.lastName}</span>
                      <span className={styles.cardRole}>{desigName}</span>
                    </div>
                  </div>
                  <span className={`${styles.statusChip} ${getStatusClass(status)}`}>
                    {status}
                  </span>
                </div>

                <div className={styles.cardDetailsList}>
                  <div className={styles.cardDetailItem}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary)' }}>
                      corporate_fare
                    </span>
                    <span>{deptName}</span>
                  </div>

                  <div className={styles.cardDetailItem}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                      mail
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {emp.email}
                    </span>
                  </div>

                  {emp.phone && (
                    <div className={styles.cardDetailItem}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                        call
                      </span>
                      <span>{emp.phone}</span>
                    </div>
                  )}

                  {emp.workShift && (
                    <div className={styles.cardDetailItem}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#10b981' }}>
                        schedule
                      </span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        Duty: {emp.workShift.startTime} - {emp.workShift.endTime}
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {emp.employmentType === 'Project-Based' ? 'Project Rate' : 'Salary'}
                    </div>
                    {emp.employmentType === 'Project-Based' ? (
                      <div style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>folder_special</span>
                        {Number(emp.basicSalary) > 0 ? `${formatCurrency(emp.basicSalary || 0)}/proj` : 'Per Project'}
                      </div>
                    ) : (
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13px' }}>
                        {formatCurrency(emp.basicSalary || 0)}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenCustomDuty(emp)}
                      title="Set Custom Duty Time"
                      style={{
                        padding: '5px 8px',
                        borderRadius: '6px',
                        background: emp.workShift ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                        color: emp.workShift ? '#10b981' : '#6366f1',
                        border: `1px solid ${emp.workShift ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                        {emp.workShift ? 'schedule' : 'more_time'}
                      </span>
                      Duty
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(emp);
                      }}
                      style={{
                        padding: '5px 8px',
                        borderRadius: '6px',
                        background: 'rgba(37, 99, 235, 0.08)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: '1px solid rgba(37, 99, 235, 0.2)',
                        cursor: 'pointer'
                      }}
                      title="Edit Profile"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span>
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEmployeeToDelete(emp);
                      }}
                      style={{
                        padding: '5px 8px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                      title="Delete Employee"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {employeeToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setEmployeeToDelete(null)}
        >
          <div
            style={{
              background: 'var(--surface-card)',
              borderRadius: '20px',
              border: '1px solid var(--border-main)',
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>warning</span>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Confirm Staff Deletion
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{employeeToDelete.firstName} {employeeToDelete.lastName}</strong> ({employeeToDelete.employeeId || employeeToDelete.email})? All associated records will be permanently removed.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                disabled={deletingId === employeeToDelete.id}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-main)',
                  background: 'var(--surface-bg)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEmployee}
                disabled={deletingId === employeeToDelete.id}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {deletingId === employeeToDelete.id ? (
                  <>
                    <span className={`material-symbols-outlined ${styles.spinning}`} style={{ fontSize: '16px' }}>progress_activity</span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                    Delete Employee
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Duty Modal Dialog */}
      {dutyModalEmployee && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '16px'
          }}
          onClick={() => !isSavingDuty && setDutyModalEmployee(null)}
        >
          <div
            style={{
              background: 'var(--surface-bg, #1e293b)',
              border: '1px solid var(--border-main, rgba(255, 255, 255, 0.1))',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.14)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>schedule</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Custom Duty Schedule
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {dutyModalEmployee.firstName} {dutyModalEmployee.lastName} ({dutyModalEmployee.employeeId || 'Staff'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDutyModalEmployee(null)}
                disabled={isSavingDuty}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Current Shift Status Banner */}
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: dutyModalEmployee.workShift ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)',
              border: `1px solid ${dutyModalEmployee.workShift ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: dutyModalEmployee.workShift ? '#10b981' : '#60a5fa' }}>
                {dutyModalEmployee.workShift ? 'verified' : 'info'}
              </span>
              <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                {dutyModalEmployee.workShift ? (
                  <>
                    <strong>Custom Duty Active:</strong> {dutyModalEmployee.workShift.startTime} — {dutyModalEmployee.workShift.endTime} (+{dutyModalEmployee.workShift.gracePeriod ?? 15}m grace)
                  </>
                ) : (
                  <>
                    <strong>Company Default Shift:</strong> 09:30 — 18:00 (+15m grace)
                  </>
                )}
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quick Preset Shifts
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Standard (9:30 - 6:00)', start: '09:30', end: '18:00', grace: 15, breakMin: 60, night: false },
                  { label: 'Morning (8:00 - 4:30)', start: '08:00', end: '16:30', grace: 15, breakMin: 45, night: false },
                  { label: 'Late (11:00 - 7:30)', start: '11:00', end: '19:30', grace: 15, breakMin: 60, night: false },
                  { label: 'Night (10:00 - 6:00)', start: '22:00', end: '06:00', grace: 20, breakMin: 60, night: true },
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setDutyStartTime(preset.start);
                      setDutyEndTime(preset.end);
                      setDutyGracePeriod(preset.grace);
                      setDutyBreakTime(preset.breakMin);
                      setDutyNightShift(preset.night);
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      background: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
                      border: '1px solid var(--border-main, rgba(255, 255, 255, 0.1))',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Duty Start Time <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="time"
                  className={styles.input}
                  value={dutyStartTime}
                  onChange={e => setDutyStartTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Duty End Time <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="time"
                  className={styles.input}
                  value={dutyEndTime}
                  onChange={e => setDutyEndTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  className={styles.input}
                  value={dutyGracePeriod}
                  onChange={e => setDutyGracePeriod(Number(e.target.value))}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Late mark threshold</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Break Allowance (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="240"
                  className={styles.input}
                  value={dutyBreakTime}
                  onChange={e => setDutyBreakTime(Number(e.target.value))}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lunch / tea recess</span>
              </div>
            </div>

            {/* Night Shift Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={dutyNightShift}
                onChange={e => setDutyNightShift(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
              />
              Night Shift (Duty crosses midnight to next morning)
            </label>

            {/* Staff App Sync Notice */}
            <div style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.02)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#10b981' }}>sync</span>
              Instantly synced with Staff App mobile portal & check-in late calculations.
            </div>

            {/* Feedback message */}
            {dutyFeedback && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                background: dutyFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: dutyFeedback.type === 'success' ? '#10b981' : '#ef4444',
                border: `1px solid ${dutyFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
              }}>
                {dutyFeedback.message}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              {dutyModalEmployee.workShift ? (
                <button
                  type="button"
                  onClick={handleResetCustomDuty}
                  disabled={isSavingDuty}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Reset to Default Shift
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDutyModalEmployee(null)}
                  disabled={isSavingDuty}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-bg)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomDuty}
                  disabled={isSavingDuty}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isSavingDuty ? (
                    <>
                      <span className={`material-symbols-outlined ${styles.spinning}`} style={{ fontSize: '16px' }}>progress_activity</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                      Save Custom Duty
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 8. Edit Employee Profile Glass Modal Popup */}
      {editModalEmployee && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 6, 12, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1060,
            padding: '16px',
            animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onClick={() => !isSavingEdit && setEditModalEmployee(null)}
        >
          <div
            className={styles.noScrollbar}
            style={{
              background: 'linear-gradient(180deg, #131722 0%, #0a0d14 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '24px',
              boxShadow: '0 30px 90px -10px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              position: 'relative',
              color: '#f8fafc'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(37, 99, 235, 0.16)',
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>edit</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    Edit Employee Profile
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    {editModalEmployee.firstName} {editModalEmployee.lastName} ({editModalEmployee.employeeId || 'Staff'})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditModalEmployee(null)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            {/* Feedback Message */}
            {editFeedback && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: editFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${editFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: editFeedback.type === 'success' ? '#34d399' : '#f87171',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {editFeedback.type === 'success' ? 'check_circle' : 'error'}
                </span>
                {editFeedback.message}
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Profile Photo Uploader Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Avatar Preview */}
                  <div style={{
                    position: 'relative',
                    width: '58px',
                    height: '58px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)'
                  }}>
                    {editPhoto ? (
                      <img
                        src={editPhoto}
                        alt="Profile Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        {`${editFirstName?.[0] || ''}${editLastName?.[0] || ''}`.toUpperCase() || 'EM'}
                      </div>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                      Profile Photo
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {isUploadingPhoto ? 'Uploading image...' : 'PNG, JPG or WEBP (Max 5MB)'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label
                    style={{
                      padding: '7px 14px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isUploadingPhoto ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      {isUploadingPhoto ? 'progress_activity' : 'photo_camera'}
                    </span>
                    {editPhoto ? 'Change Photo' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {editPhoto && (
                    <button
                      type="button"
                      onClick={() => setEditPhoto('')}
                      title="Remove Photo"
                      style={{
                        padding: '7px 10px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Name fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={e => setEditFirstName(e.target.value)}
                    className={styles.input}
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={e => setEditLastName(e.target.value)}
                    className={styles.input}
                    placeholder="Last Name"
                  />
                </div>
              </div>

              {/* Contact fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px' }}>
                    Official Email
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className={styles.input}
                    placeholder="employee@company.com"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className={styles.input}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>

              {/* Role & Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Designation */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                      Designation
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditIsCustomDesig(!editIsCustomDesig)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {editIsCustomDesig ? '← Select List' : '+ Custom'}
                    </button>
                  </div>
                  {editIsCustomDesig ? (
                    <input
                      type="text"
                      required
                      value={editDesignation}
                      onChange={e => {
                        setEditDesignation(e.target.value);
                        setEditDesignationId('');
                      }}
                      className={styles.input}
                      placeholder="e.g. Lead Designer"
                    />
                  ) : (
                    <select
                      value={editDesignation}
                      onChange={e => {
                        const val = e.target.value;
                        setEditDesignation(val);
                        const match = designations.find(d => d.name === val);
                        setEditDesignationId(match ? match.id : '');
                      }}
                      className={styles.input}
                      required
                    >
                      <option value="">-- Select Designation --</option>
                      {editDesignation && !designations.some(d => d.name === editDesignation) && (
                        <option value={editDesignation}>{editDesignation} (Current)</option>
                      )}
                      {designations.map(d => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Department */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                      Department
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditIsCustomDept(!editIsCustomDept)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {editIsCustomDept ? '← Select List' : '+ Custom'}
                    </button>
                  </div>
                  {editIsCustomDept ? (
                    <input
                      type="text"
                      required
                      value={editDepartment}
                      onChange={e => {
                        setEditDepartment(e.target.value);
                        setEditDepartmentId('');
                      }}
                      className={styles.input}
                      placeholder="e.g. Engineering"
                    />
                  ) : (
                    <select
                      value={editDepartment}
                      onChange={e => {
                        const val = e.target.value;
                        setEditDepartment(val);
                        const match = departments.find(d => d.name === val);
                        setEditDepartmentId(match ? match.id : '');
                      }}
                      className={styles.input}
                      required
                    >
                      <option value="">-- Select Department --</option>
                      {editDepartment && !departments.some(d => d.name === editDepartment) && (
                        <option value={editDepartment}>{editDepartment} (Current)</option>
                      )}
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Salary & Employment Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px' }}>
                    Basic Salary / Rate (BDT)
                  </label>
                  <input
                    type="number"
                    value={editBasicSalary}
                    onChange={e => setEditBasicSalary(e.target.value)}
                    className={styles.input}
                    placeholder="50000"
                    min="0"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px' }}>
                    Employment Contract
                  </label>
                  <select
                    value={editEmploymentType}
                    onChange={e => setEditEmploymentType(e.target.value)}
                    className={styles.input}
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Project-Based">Project-Based</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
              </div>

              {/* Employment Status */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px' }}>
                  Workforce Status
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className={styles.input}
                >
                  <option value="ACTIVE">ACTIVE (Working)</option>
                  <option value="ON_LEAVE">ON_LEAVE (Leave / Vacation)</option>
                  <option value="TERMINATED">TERMINATED (Inactive / Exited)</option>
                </select>
              </div>

              {/* Form Action Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditModalEmployee(null)}
                  disabled={isSavingEdit}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingEdit}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  {isSavingEdit ? (
                    <>
                      <span className={`material-symbols-outlined ${styles.spinning}`} style={{ fontSize: '16px' }}>progress_activity</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Executive Employee Quick Details Card Modal (Redesigned to Modern Dark Aesthetic) */}
      {selectedEmployee && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 6, 12, 0.82)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '16px',
            animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onClick={() => setSelectedEmployee(null)}
        >
          <div
            className={styles.noScrollbar}
            style={{
              background: 'linear-gradient(180deg, #11141e 0%, #080a10 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '28px',
              width: '100%',
              maxWidth: '440px',
              maxHeight: '92vh',
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              boxShadow: '0 30px 90px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              color: '#f8fafc',
              padding: '22px'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '260px',
              height: '260px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(20px)'
            }} />

            {/* Top Navigation Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              position: 'relative',
              zIndex: 2,
              flexShrink: 0
            }}>
              {/* Left: Circular Back / Close Button */}
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Back / Close"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
              </button>

              {/* Right: Circular Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Edit Profile Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const emp = selectedEmployee;
                    handleOpenEditModal(emp);
                  }}
                  title="Edit Profile"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(37, 99, 235, 0.15)',
                    border: '1px solid rgba(37, 99, 235, 0.35)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                </button>

                {/* Custom Duty Sparkle Action */}
                <button
                  type="button"
                  onClick={() => {
                    const emp = selectedEmployee;
                    setSelectedEmployee(null);
                    handleOpenCustomDuty(emp);
                  }}
                  title="Configure Custom Duty Shift"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: selectedEmployee.workShift ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.07)',
                    border: `1px solid ${selectedEmployee.workShift ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: selectedEmployee.workShift ? '#a5b4fc' : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
                </button>

                {/* ID Tag / Copy ID Button */}
                {selectedEmployee.employeeId && (
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedEmployee.employeeId || '', 'id')}
                    title={`Click to copy ID: ${selectedEmployee.employeeId}`}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: copiedField === 'id' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.07)',
                      border: `1px solid ${copiedField === 'id' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: copiedField === 'id' ? '#34d399' : '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
                      {copiedField === 'id' ? 'check' : 'tag'}
                    </span>
                  </button>
                )}

                {/* Delete Employee Icon Button */}
                <button
                  type="button"
                  onClick={() => {
                    const emp = selectedEmployee;
                    setSelectedEmployee(null);
                    setEmployeeToDelete(emp);
                  }}
                  title="Delete Employee"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.22)',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </div>
            </div>

            {/* Hero Profile Identity Section (Two-Column Layout) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '16px',
              position: 'relative',
              zIndex: 2,
              flexShrink: 0
            }}>
              {/* Left Column: Subtitle, Full Name, Rate / Salary */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#94a3b8',
                  letterSpacing: '0.02em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {selectedEmployee.designationRef?.name || selectedEmployee.designation || 'Staff'}
                  {' • '}
                  {selectedEmployee.departmentRef?.name || selectedEmployee.department || 'Operations'}
                </span>

                <h2 style={{
                  margin: '4px 0 6px',
                  fontSize: '23px',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </h2>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginTop: '2px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    {formatCurrency(selectedEmployee.basicSalary || 0)}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                    {selectedEmployee.employmentType === 'Project-Based' ? '/session' : '/month'}
                  </span>
                </div>
              </div>

              {/* Right Column: Avatar Portrait Card */}
              <div style={{
                position: 'relative',
                width: '110px',
                height: '130px',
                borderRadius: '22px',
                background: 'linear-gradient(145deg, #1c2438 0%, #0d121e 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden'
              }}>
                {selectedEmployee.profile?.photo || selectedEmployee.photo || selectedEmployee.avatar ? (
                  <img
                    src={selectedEmployee.profile?.photo || selectedEmployee.photo || selectedEmployee.avatar || ''}
                    alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      inset: 0
                    }}
                  />
                ) : (
                  <>
                    {/* Inner Glow Aura */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'radial-gradient(circle at 50% 45%, rgba(99, 102, 241, 0.35) 0%, transparent 75%)',
                      pointerEvents: 'none'
                    }} />

                    {/* Avatar Initials Badge */}
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 60%, #94a3b8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '1px',
                      zIndex: 1
                    }}>
                      {`${selectedEmployee.firstName?.[0] || ''}${selectedEmployee.lastName?.[0] || ''}`.toUpperCase() || 'EM'}
                    </div>
                  </>
                )}

                {/* Status Indicator Chip */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 2
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: selectedEmployee.status === 'TERMINATED'
                      ? '#f87171'
                      : selectedEmployee.status === 'ON_LEAVE'
                      ? '#fbbf24'
                      : '#34d399',
                    boxShadow: `0 0 6px ${
                      selectedEmployee.status === 'TERMINATED'
                        ? '#f87171'
                        : selectedEmployee.status === 'ON_LEAVE'
                        ? '#fbbf24'
                        : '#34d399'
                    }`
                  }} />
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: selectedEmployee.status === 'TERMINATED'
                      ? '#f87171'
                      : selectedEmployee.status === 'ON_LEAVE'
                      ? '#fbbf24'
                      : '#34d399'
                  }}>
                    {selectedEmployee.status || 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Frosted Glass Highlight Stat Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '16px',
              position: 'relative',
              zIndex: 2,
              flexShrink: 0
            }}>
              {/* Stat 1: Contract */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                padding: '10px 10px',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600 }}>Contract</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#fbbf24' }}>work_outline</span>
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {selectedEmployee.employmentType || 'Full-Time'}
                </div>
              </div>

              {/* Stat 2: Duty Shift */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                padding: '10px 10px',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600 }}>
                    {selectedEmployee.workShift ? 'Shift' : 'Duty'}
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#818cf8' }}>schedule</span>
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {selectedEmployee.workShift ? selectedEmployee.workShift.startTime : '09:30'}
                </div>
              </div>

              {/* Stat 3: Employee ID */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                padding: '10px 10px',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600 }}>Employee ID</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#34d399' }}>badge</span>
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {selectedEmployee.employeeId ? `#${selectedEmployee.employeeId.replace('EMP-', '')}` : 'ACTIVE'}
                </div>
              </div>
            </div>

            {/* Segmented Tab Bar Navigation */}
            <div
              className={styles.noScrollbar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '6px',
                paddingBottom: '10px',
                marginTop: '4px',
                marginBottom: '14px',
                position: 'relative',
                zIndex: 2,
                overflowX: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                flexShrink: 0
              }}
            >
              {(['about', 'availability', 'experience', 'payroll'] as const).map(tab => {
                const isActive = modalActiveTab === tab;
                const tabLabels: Record<string, string> = {
                  about: 'About',
                  availability: 'Availability',
                  experience: 'Experience',
                  payroll: 'Payroll'
                };
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setModalActiveTab(tab)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '4px 0',
                      color: isActive ? '#ffffff' : '#64748b',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      position: 'relative',
                      whiteSpace: 'nowrap',
                      lineHeight: '1.4',
                      transition: 'color 0.15s ease'
                    }}
                  >
                    {tabLabels[tab]}
                    {isActive && (
                      <span style={{
                        position: 'absolute',
                        bottom: '-11px',
                        left: 0,
                        right: 0,
                        height: '2.5px',
                        background: 'linear-gradient(90deg, #34d399 0%, #38bdf8 100%)',
                        borderRadius: '2px',
                        boxShadow: '0 0 8px rgba(52, 211, 153, 0.5)'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Dynamic Body */}
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
              {/* Tab 1: About */}
              {modalActiveTab === 'about' && (
                <>
                  {/* Bio Paragraph */}
                  <p style={{
                    margin: 0,
                    fontSize: '12.5px',
                    color: '#94a3b8',
                    lineHeight: 1.55
                  }}>
                    {selectedEmployee.firstName} {selectedEmployee.lastName} is an active{' '}
                    <strong style={{ color: '#ffffff', fontWeight: 600 }}>
                      {selectedEmployee.designationRef?.name || selectedEmployee.designation || 'Staff'}
                    </strong>{' '}
                    in the{' '}
                    <strong style={{ color: '#ffffff', fontWeight: 600 }}>
                      {selectedEmployee.departmentRef?.name || selectedEmployee.department || 'Operations'}
                    </strong>{' '}
                    department. Contracted under {selectedEmployee.employmentType || 'Full-Time'} terms with verified duty telemetry.
                    {isBioExpanded && (
                      <span>
                        {' '}Joined {selectedEmployee.joinDate ? new Date(selectedEmployee.joinDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'recently'}. Biometric attendance and custom duty shifts are actively monitored.
                      </span>
                    )}
                    <span
                      onClick={() => setIsBioExpanded(!isBioExpanded)}
                      style={{ color: '#38bdf8', cursor: 'pointer', fontWeight: 600, marginLeft: '4px' }}
                    >
                      {isBioExpanded ? 'Less' : '...More'}
                    </span>
                  </p>

                  {/* 2x2 Feature Grid Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px'
                  }}>
                    {/* Grid Card 1: Base Salary */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '16px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#34d399',
                        marginBottom: '2px'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>payments</span>
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500 }}>
                        {selectedEmployee.employmentType === 'Project-Based' ? 'Session Fee' : 'Base Salary'}
                      </span>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                        {formatCurrency(selectedEmployee.basicSalary || 0)}
                      </div>
                    </div>

                    {/* Grid Card 2: Duty Shift */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '16px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#818cf8',
                        marginBottom: '2px'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span>
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500 }}>Duty Shift</span>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        {selectedEmployee.workShift ? `${selectedEmployee.workShift.startTime} - ${selectedEmployee.workShift.endTime}` : '09:30 - 18:00'}
                      </div>
                      <span style={{ fontSize: '9.5px', color: '#64748b' }}>
                        Grace: {selectedEmployee.workShift?.gracePeriod ?? 15}m • Break: {selectedEmployee.workShift?.breakTime ?? 60}m
                      </span>
                    </div>

                    {/* Grid Card 3: Official Email */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '16px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: 'rgba(59, 130, 246, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#60a5fa'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>mail</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedEmployee.email, 'email')}
                          title="Copy Email"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: copiedField === 'email' ? '#34d399' : '#64748b',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            {copiedField === 'email' ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500 }}>Official Email</span>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#ffffff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={selectedEmployee.email}
                      >
                        {selectedEmployee.email}
                      </div>
                    </div>

                    {/* Grid Card 4: Phone Number */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '16px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: 'rgba(52, 211, 153, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#34d399'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>call</span>
                        </div>
                        {selectedEmployee.phone && (
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedEmployee.phone || '', 'phone')}
                            title="Copy Phone"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedField === 'phone' ? '#34d399' : '#64748b',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                              {copiedField === 'phone' ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        )}
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500 }}>Phone Number</span>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: selectedEmployee.phone ? '#ffffff' : '#64748b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {selectedEmployee.phone || 'Not Provided'}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 2: Availability / Shift Details */}
              {modalActiveTab === 'availability' && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '18px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#818cf8' }}>sensors</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Active Duty Timing</span>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: selectedEmployee.workShift?.nightShift ? '#f59e0b' : '#38bdf8',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)'
                    }}>
                      {selectedEmployee.workShift?.nightShift ? '🌙 Night Shift' : '☀️ Day Shift'}
                    </span>
                  </div>

                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                    {selectedEmployee.workShift ? `${selectedEmployee.workShift.startTime} — ${selectedEmployee.workShift.endTime}` : '09:30 AM — 06:00 PM'}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '4px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Grace Period</span>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                        {selectedEmployee.workShift?.gracePeriod ?? 15} Minutes
                      </div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Meal & Break</span>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                        {selectedEmployee.workShift?.breakTime ?? 60} Minutes
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const emp = selectedEmployee;
                      setSelectedEmployee(null);
                      handleOpenCustomDuty(emp);
                    }}
                    style={{
                      marginTop: '4px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#a5b4fc',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span>
                    Configure Duty Shift
                  </button>
                </div>
              )}

              {/* Tab 3: Experience & Roles */}
              {modalActiveTab === 'experience' && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '18px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#38bdf8' }}>badge</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Employment & Tenure</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Designation</span>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                        {selectedEmployee.designationRef?.name || selectedEmployee.designation || 'Staff'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Department</span>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                        {selectedEmployee.departmentRef?.name || selectedEmployee.department || 'Operations'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Join Date</span>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                        {selectedEmployee.joinDate ? new Date(selectedEmployee.joinDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Active'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Contract Type</span>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                        {selectedEmployee.employmentType || 'Full-Time'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Payroll & Terms */}
              {modalActiveTab === 'payroll' && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '18px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#34d399' }}>account_balance_wallet</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Compensation Summary</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Base Salary</span>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399' }}>
                        {formatCurrency(selectedEmployee.basicSalary || 0)}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Billing Frequency</span>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                        {selectedEmployee.employmentType === 'Project-Based' ? 'Per Project' : 'Monthly Retainer'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Footer */}
            <div style={{
              marginTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              zIndex: 2
            }}>
              {/* Primary Full Width CTA Button (White Pill style matching Image 2) */}
              <Link
                href={`/erp/hr/employees/${selectedEmployee.id}`}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '9999px',
                  background: '#ffffff',
                  color: '#090b10',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 20px rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Open Full Profile
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
