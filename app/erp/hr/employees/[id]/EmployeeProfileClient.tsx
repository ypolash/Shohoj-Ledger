"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from "../../../income/page.module.css";
import { updateExtendedProfile, saveDocumentMetadata, saveNote } from "./actions";
import PersonalTab from '../components/PersonalTab';
import EducationTab from '../components/EducationTab';
import ExperienceTab from '../components/ExperienceTab';
import FamilyTab from '../components/FamilyTab';

interface EmployeeProfileClientProps {
  employee: any;
  initialMode?: 'BASIC' | 'PROFESSIONAL';
}

export default function EmployeeProfileClient({ employee, initialMode = 'BASIC' }: EmployeeProfileClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'BASIC' | 'PROFESSIONAL'>(initialMode);
  const [activeTab, setActiveTab] = useState("Profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lifecycles, setLifecycles] = useState<any[]>([]);
  const [isLifecycleModalOpen, setIsLifecycleModalOpen] = useState(false);
  const [newLifecycle, setNewLifecycle] = useState({
    eventType: 'HIRE',
    effectiveDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    fetchLifecycles();
  }, []);

  const fetchLifecycles = async () => {
    try {
      const res = await fetch(`/api/employees/${employee.id}/lifecycle`);
      if (res.ok) setLifecycles(await res.json());
    } catch (error) {
      console.error("Failed to fetch lifecycles", error);
    }
  };

  const handleCreateLifecycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/employees/${employee.id}/lifecycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLifecycle)
      });
      if (res.ok) {
        setIsLifecycleModalOpen(false);
        fetchLifecycles();
        alert("Lifecycle event added successfully!");
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert("Failed to add lifecycle event.");
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    email: employee.email || '',
    phone: employee.phone || '',
    designation: employee.designation || '',
    department: employee.department || employee.departmentRef?.name || '',
    departmentId: employee.departmentId || '',
    designationId: employee.designationId || '',
    basicSalary: employee.basicSalary || '',
    status: employee.status || 'ACTIVE',
    employeeId: employee.employeeId || '',
    employmentType: employee.employmentType || 'Full-Time',
    joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '',
    location: employee.location || 'Headquarters',
    profile: {
      dateOfBirth: employee.profile?.dateOfBirth ? new Date(employee.profile.dateOfBirth).toISOString().split('T')[0] : '',
      gender: employee.profile?.gender || 'Male',
      bloodGroup: employee.profile?.bloodGroup || '',
      nationalId: employee.profile?.nationalId || '',
      maritalStatus: employee.profile?.maritalStatus || 'Single',
      photo: employee.profile?.photo || '',
      secondaryPhone: employee.profile?.secondaryPhone || '',
      currentAddress: employee.profile?.currentAddress || '',
      mainAddress: employee.profile?.mainAddress || '',
      bankName: employee.profile?.bankName || '',
      accountName: employee.profile?.accountName || '',
      accountNumber: employee.profile?.accountNumber || '',
      fatherName: employee.profile?.fatherName || '',
      motherName: employee.profile?.motherName || '',
      spouseName: employee.profile?.spouseName || '',
      nomineeName: employee.profile?.nomineeName || '',
      nomineeRelation: employee.profile?.nomineeRelation || '',
      nomineePhoto: employee.profile?.nomineePhoto || '',
      nomineeNid: employee.profile?.nomineeNid || ''
    },
    education: employee.education?.length ? employee.education : [],
    experience: employee.experience?.length ? employee.experience : []
  });

  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState<{ id: number, text: string, date: string }[]>([]);
  const [newNote, setNewNote] = useState("");
  const [documents, setDocuments] = useState<{ id: number, name: string, type: string, uploadDate: string }[]>([]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateExtendedProfile(employee.id, formData);
      alert("Employee details updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      alert("Failed to update employee: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEmployee = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Employee deleted successfully.");
        router.push('/erp/hr/employees');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete employee");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote) return;
    try {
      await saveNote(employee.id, newNote);
      setNotes([{ id: Date.now(), text: newNote, date: new Date().toISOString() }, ...notes]);
      setNewNote("");
    } catch (err: any) {
      alert("Failed to save note");
    }
  };

  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await saveDocumentMetadata(employee.id, { name: file.name, type });
        setDocuments([{ id: Date.now(), name: file.name, type, uploadDate: new Date().toISOString() }, ...documents]);
        alert(`${type} uploaded successfully.`);
      } catch (err) {
        alert("Failed to upload document.");
      }
    }
  };

  const getInitials = (f: string, l: string) => `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase() || 'EMP';

  const formatCurrency = (val?: number | string | null) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const handleProfileChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
  };

  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', board: '', subject: '', passingYear: '', result: '' }]
    }));
  };

  const handleRemoveEducation = (index: number) => {
    setFormData(prev => {
      const newEdu = [...prev.education];
      newEdu.splice(index, 1);
      return { ...prev, education: newEdu };
    });
  };

  const handleEducationChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newEdu = [...prev.education];
      newEdu[index] = { ...newEdu[index], [field]: value };
      return { ...prev, education: newEdu };
    });
  };

  const handleAddExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', joiningDate: '', leavingDate: '', salary: '', reason: '' }]
    }));
  };

  const handleRemoveExperience = (index: number) => {
    setFormData(prev => {
      const newExp = [...prev.experience];
      newExp.splice(index, 1);
      return { ...prev, experience: newExp };
    });
  };

  const handleExperienceChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newExp = [...prev.experience];
      newExp[index] = { ...newExp[index], [field]: value };
      return { ...prev, experience: newExp };
    });
  };

  const tabs = ["Profile", "Documents", "Notes", "Timeline"];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Top Header Card with Back Navigation and Mode Switcher */}
      <div style={{
        background: 'var(--surface-card, #1e293b)',
        borderRadius: '18px',
        border: '1px solid var(--border-main, rgba(255,255,255,0.08))',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={() => router.push('/erp/hr/employees')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              border: '1px solid var(--border-main, rgba(255,255,255,0.1))',
              background: 'var(--surface-hover, rgba(255,255,255,0.05))',
              color: 'var(--text-main, #f8fafc)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Back to Employees List"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-main, #f8fafc)' }}>
                {formData.firstName} {formData.lastName}
              </h1>
              {formData.employeeId && (
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}>
                  {formData.employeeId}
                </span>
              )}
              <span style={{
                padding: '3px 10px',
                borderRadius: '8px',
                background: formData.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: formData.status === 'ACTIVE' ? '#10b981' : '#ef4444',
                fontSize: '12px',
                fontWeight: 700,
                border: `1px solid ${formData.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {formData.status}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #94a3b8)' }}>
              {formData.designation || 'Staff'} {formData.department ? `• ${formData.department}` : ''} • Joined {formData.joinDate ? new Date(formData.joinDate).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        {/* Mode Selector & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--surface-bg, rgba(0,0,0,0.25))',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--border-main, rgba(255,255,255,0.08))'
          }}>
            <button
              type="button"
              onClick={() => { setViewMode('BASIC'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'BASIC' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                color: viewMode === 'BASIC' ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>bolt</span>
              Basic Mode
            </button>

            <button
              type="button"
              onClick={() => { setViewMode('PROFESSIONAL'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'PROFESSIONAL' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                color: viewMode === 'PROFESSIONAL' ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>workspace_premium</span>
              Professional Dossier
            </button>
          </div>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: isEditing ? '1px solid var(--border-main)' : 'none',
              background: isEditing ? 'var(--surface-hover, rgba(255,255,255,0.05))' : 'var(--primary, #2563eb)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {isEditing ? 'close' : 'edit'}
            </span>
            {isEditing ? 'Cancel Edit' : (viewMode === 'BASIC' ? 'Edit (Basic)' : 'Edit Profile')}
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Delete Employee"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
            Delete
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE: BASIC MODE
          ========================================================================= */}
      {viewMode === 'BASIC' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isEditing ? (
            /* 1. Basic Mode Details View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Main Information Banner */}
              <div style={{
                background: 'var(--surface-card, #1e293b)',
                borderRadius: '18px',
                border: '1px solid var(--border-main, rgba(255,255,255,0.08))',
                padding: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#ffffff',
                    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
                  }}>
                    {getInitials(formData.firstName, formData.lastName)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-main, #f8fafc)' }}>
                        {formData.firstName} {formData.lastName}
                      </h2>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: '1px solid rgba(245, 158, 11, 0.3)'
                      }}>
                        BASIC PROFILE
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted, #94a3b8)' }}>
                      {formData.designation || 'Staff Member'} &bull; {formData.department || 'General'}
                    </p>
                  </div>
                </div>

                {/* Core Details Grid (7-9 Primary Fields) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px'
                }}>
                  {/* Phone */}
                  <div style={{
                    background: 'var(--surface-bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border-main, rgba(255,255,255,0.06))',
                    padding: '16px 18px',
                    borderRadius: '14px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#38bdf8' }}>call</span>
                      Phone Number
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                      {formData.phone || '—'}
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{
                    background: 'var(--surface-bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border-main, rgba(255,255,255,0.06))',
                    padding: '16px 18px',
                    borderRadius: '14px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#818cf8' }}>mail</span>
                      Email Address
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main, #f8fafc)', wordBreak: 'break-all' }}>
                      {formData.email || '—'}
                    </div>
                  </div>

                  {/* Designation */}
                  <div style={{
                    background: 'var(--surface-bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border-main, rgba(255,255,255,0.06))',
                    padding: '16px 18px',
                    borderRadius: '14px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#a78bfa' }}>badge</span>
                      Designation / Role
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                      {formData.designation || 'Staff'}
                    </div>
                  </div>

                  {/* Department */}
                  <div style={{
                    background: 'var(--surface-bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border-main, rgba(255,255,255,0.06))',
                    padding: '16px 18px',
                    borderRadius: '14px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#34d399' }}>corporate_fare</span>
                      Department
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                      {formData.department || 'Unassigned'}
                    </div>
                  </div>

                  {/* Basic Salary */}
                  <div style={{
                    background: 'var(--surface-bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border-main, rgba(255,255,255,0.06))',
                    padding: '16px 18px',
                    borderRadius: '14px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#fbbf24' }}>payments</span>
                      Basic Salary
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>
                      {formData.employmentType === 'Project-Based'
                        ? `${formatCurrency(formData.basicSalary)} / Project`
                        : `${formatCurrency(formData.basicSalary)} / Month`}
                    </div>
                  </div>

                  {/* Joining Date */}
                  <div style={{
                    background: 'var(--surface-bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border-main, rgba(255,255,255,0.06))',
                    padding: '16px 18px',
                    borderRadius: '14px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#f472b6' }}>event</span>
                      Joining Date
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                      {formData.joinDate ? new Date(formData.joinDate).toLocaleDateString() : '—'}
                    </div>
                  </div>

                  {/* Address */}
                  <div style={{
                    background: 'var(--surface-bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border-main, rgba(255,255,255,0.06))',
                    padding: '16px 18px',
                    borderRadius: '14px',
                    gridColumn: '1 / -1'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#fb7185' }}>home_pin</span>
                      Present Address
                    </div>
                    <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                      {formData.profile.currentAddress || formData.profile.mainAddress || 'No address provided'}
                    </div>
                  </div>

                  {/* Shift & Custom Duty */}
                  <div style={{
                    background: 'var(--surface-bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border-main, rgba(255,255,255,0.06))',
                    padding: '16px 18px',
                    borderRadius: '14px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#10b981' }}>schedule</span>
                      Assigned Shift / Duty
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                      {employee.workShift ? `${employee.workShift.name} (${employee.workShift.startTime} - ${employee.workShift.endTime})` : (employee.shift || 'General Shift')}
                    </div>
                  </div>

                  {/* Location */}
                  <div style={{
                    background: 'var(--surface-bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border-main, rgba(255,255,255,0.06))',
                    padding: '16px 18px',
                    borderRadius: '14px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#60a5fa' }}>location_on</span>
                      Work Branch / Location
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                      {formData.location || 'Headquarters'}
                    </div>
                  </div>
                </div>

                {/* Basic Mode Quick Actions Footer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginTop: '28px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-main, rgba(255,255,255,0.08))'
                }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                    Edit Basic Info
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('PROFESSIONAL')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-main, rgba(255,255,255,0.12))',
                      background: 'var(--surface-hover, rgba(255,255,255,0.05))',
                      color: 'var(--text-main, #f8fafc)',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#38bdf8' }}>folder_open</span>
                    Open Full Enterprise Dossier
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 2. Basic Mode Editing Form */
            <form onSubmit={handleSaveProfile} style={{
              background: 'var(--surface-card, #1e293b)',
              borderRadius: '18px',
              border: '1px solid var(--border-main, rgba(255,255,255,0.08))',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#f59e0b' }}>bolt</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main, #f8fafc)' }}>
                    Edit Employee (Basic Mode)
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted, #94a3b8)' }}>
                    Quickly update the 7 core employee fields.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* First Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="input"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {/* Designation */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                    Designation / Role *
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>

                {/* Department */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>

                {/* Basic Salary */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                    Basic Salary (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input"
                    value={formData.basicSalary}
                    onChange={e => setFormData({ ...formData, basicSalary: e.target.value })}
                  />
                </div>

                {/* Join Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                    Joining Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.joinDate}
                    onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                  />
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    className="input"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="TERMINATED">TERMINATED</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                    Work Branch / Location
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                {/* Present Address */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                    Present Address
                  </label>
                  <textarea
                    rows={2}
                    className="input"
                    value={formData.profile.currentAddress}
                    onChange={e => handleProfileChange('currentAddress', e.target.value)}
                    placeholder="Street, City, Post Code"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    borderColor: '#f59e0b'
                  }}
                >
                  {isSaving ? "Saving..." : "Save Basic Info"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW MODE: PROFESSIONAL ENTERPRISE DOSSIER
          ========================================================================= */}
      {viewMode === 'PROFESSIONAL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sub Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t)}
                style={{ 
                  padding: '10px 20px', 
                  background: 'none', 
                  border: 'none', 
                  borderBottom: activeTab === t ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === t ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: activeTab === t ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: '14.5px',
                  marginBottom: '-9px'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === "Profile" && (
            <div style={{ position: 'relative' }}>
              {!isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <PersonalTab formData={formData} setFormData={setFormData} isEditing={false} employee={employee} getInitials={getInitials} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <EducationTab formData={formData} setFormData={setFormData} isEditing={false} employee={employee} handleAddEducation={handleAddEducation} handleRemoveEducation={handleRemoveEducation} handleEducationChange={handleEducationChange} />
                      <ExperienceTab formData={formData} setFormData={setFormData} isEditing={false} employee={employee} handleAddExperience={handleAddExperience} handleRemoveExperience={handleRemoveExperience} handleExperienceChange={handleExperienceChange} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <FamilyTab formData={formData} setFormData={setFormData} isEditing={false} employee={employee} handleProfileChange={handleProfileChange} />
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                  <PersonalTab formData={formData} setFormData={setFormData} isEditing={true} employee={employee} handleProfileChange={handleProfileChange} getInitials={getInitials} />
                  <EducationTab formData={formData} setFormData={setFormData} isEditing={true} employee={employee} handleAddEducation={handleAddEducation} handleRemoveEducation={handleRemoveEducation} handleEducationChange={handleEducationChange} />
                  <ExperienceTab formData={formData} setFormData={setFormData} isEditing={true} employee={employee} handleAddExperience={handleAddExperience} handleRemoveExperience={handleRemoveExperience} handleExperienceChange={handleExperienceChange} />
                  <FamilyTab formData={formData} setFormData={setFormData} isEditing={true} employee={employee} handleProfileChange={handleProfileChange} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-6)', gap: '10px' }}>
                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? "Saving Profile..." : "Save Complete Profile"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "Documents" && (
            <div className="glass-card">
              <h3 style={{ margin: '0 0 var(--spacing-6) 0' }}>Employee Documents</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {["Profile Photo", "Resume", "National ID", "Passport", "Driving License", "Certificates", "Offer Letter", "Appointment Letter"].map(docType => (
                  <div key={docType} style={{ border: '1px dashed var(--border)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)', marginBottom: '8px' }}>upload_file</span>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>{docType}</div>
                    <label className="btn btn-secondary" style={{ fontSize: '12px', cursor: 'pointer', display: 'inline-block' }}>
                      Upload
                      <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, docType)} />
                    </label>
                  </div>
                ))}
              </div>
              {documents.length > 0 && (
                <div>
                  <h4>Uploaded Documents (Metadata)</h4>
                  <table className={styles.table}>
                    <thead><tr><th>Document Name</th><th>Type</th><th>Upload Date</th></tr></thead>
                    <tbody>
                      {documents.map(d => (
                        <tr key={d.id}>
                          <td>{d.name}</td>
                          <td>{d.type}</td>
                          <td>{new Date(d.uploadDate).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "Notes" && (
            <div className="glass-card">
              <h3 style={{ margin: '0 0 var(--spacing-6) 0' }}>HR Notes</h3>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <textarea 
                  className="input" 
                  placeholder="Add a new HR note..." 
                  value={newNote} 
                  onChange={e => setNewNote(e.target.value)}
                  style={{ flex: 1, minHeight: '80px', resize: 'vertical' }}
                />
                <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={handleAddNote}>Add Note</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {notes.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No notes added yet.</p> : notes.map(note => (
                  <div key={note.id} style={{ background: 'var(--surface-light)', padding: '16px', borderRadius: '8px', position: 'relative' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{new Date(note.date).toLocaleString()}</div>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{note.text}</p>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === "Timeline" && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                <h3 style={{ margin: 0 }}>Employee Timeline & Lifecycle</h3>
                <button className="btn btn-primary" onClick={() => setIsLifecycleModalOpen(true)}>Add Event</button>
              </div>
              
              <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid var(--border)' }}>
                {lifecycles.map((lc) => (
                  <div key={lc.id} style={{ position: 'relative', marginBottom: '24px' }}>
                    <div style={{ position: 'absolute', left: '-31px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--surface)' }}></div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(lc.effectiveDate).toLocaleDateString()}</div>
                    <div style={{ fontWeight: 500 }}>{lc.eventType}</div>
                    {lc.description && <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{lc.description}</div>}
                  </div>
                ))}

                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <div style={{ position: 'absolute', left: '-31px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--surface)' }}></div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(employee.joinDate).toLocaleDateString()}</div>
                  <div style={{ fontWeight: 500 }}>Joined Company</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Officially joined as {employee.designation}.</div>
                </div>

                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <div style={{ position: 'absolute', left: '-31px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--surface)' }}></div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(employee.createdAt).toLocaleDateString()}</div>
                  <div style={{ fontWeight: 500 }}>Profile Created</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Employee profile was initialized in the system.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              background: 'var(--surface-card, #1e293b)',
              borderRadius: '20px',
              border: '1px solid var(--border-main, rgba(255,255,255,0.1))',
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>warning</span>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                  Confirm Staff Deletion
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #94a3b8)' }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{formData.firstName} {formData.lastName}</strong> ({formData.employeeId || formData.email})? All associated attendance, tasks, and records will be permanently removed.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                disabled={isDeleting}
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
                {isDeleting ? "Deleting..." : "Delete Employee"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lifecycle Modal */}
      {isLifecycleModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100,
          paddingTop: '8vh'
        }}>
          <div className="glass-card" style={{ width: '400px', maxWidth: '90%', padding: '32px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Add Lifecycle Event</h2>
              <button onClick={() => setIsLifecycleModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateLifecycle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Event Type *</label>
                <select className="input" value={newLifecycle.eventType} onChange={e => setNewLifecycle({...newLifecycle, eventType: e.target.value})} required>
                  <option value="HIRE">HIRE</option>
                  <option value="CONFIRM">CONFIRM</option>
                  <option value="PROMOTE">PROMOTE</option>
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="SUSPEND">SUSPEND</option>
                  <option value="REINSTATE">REINSTATE</option>
                  <option value="RESIGN">RESIGN</option>
                  <option value="TERMINATE">TERMINATE</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Effective Date *</label>
                <input type="date" className="input" value={newLifecycle.effectiveDate} onChange={e => setNewLifecycle({...newLifecycle, effectiveDate: e.target.value})} required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Description</label>
                <textarea className="input" rows={3} value={newLifecycle.description} onChange={e => setNewLifecycle({...newLifecycle, description: e.target.value})}></textarea>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsLifecycleModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
