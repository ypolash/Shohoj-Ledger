"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createEmployee } from "@/app/erp/staff-management/employees/actions";
import styles from "./EmployeeNewClient.module.css";

interface Department {
  id: string;
  name: string;
}

interface Designation {
  id: string;
  name: string;
}

export default function EmployeeNewClient({ isMember = false }: { isMember?: boolean }) {
  const router = useRouter();
  const pathname = usePathname() || '';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [activeTab, setActiveTab] = useState<'core' | 'job' | 'personal' | 'contact' | 'bank' | 'experience' | 'all'>('core');
  const [collectionMode, setCollectionMode] = useState<'BASIC' | 'PROFESSIONAL'>('PROFESSIONAL');

  useEffect(() => {
    Promise.all([
      fetch('/api/departments').then(res => res.ok ? res.json() : []),
      fetch('/api/designations').then(res => res.ok ? res.json() : []),
      fetch('/api/settings/onboarding').then(res => res.ok ? res.json() : null)
    ]).then(([deptData, desigData, onboardingData]) => {
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setDesignations(Array.isArray(desigData) ? desigData : []);
      if (onboardingData?.mode === 'BASIC' || onboardingData?.mode === 'PROFESSIONAL') {
        setCollectionMode(onboardingData.mode);
      }
    }).catch(console.error);
  }, []);

  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    departmentId: '',
    designationId: '',
    reportingManagerId: '',
    employmentType: 'Full-Time',
    employmentStatus: 'Probation',
    location: 'Headquarters',
    shift: 'General Shift',
    basicSalary: '',
    joinDate: new Date().toISOString().split('T')[0],
    password: '',
    status: 'ACTIVE',
    profile: {
      dateOfBirth: '',
      gender: 'Male',
      bloodGroup: 'B+',
      nationalId: '',
      maritalStatus: 'Single',
      photo: '',
      secondaryPhone: '',
      currentAddress: '',
      mainAddress: '',
      bankName: '',
      accountName: '',
      accountNumber: '',
      fatherName: '',
      motherName: '',
      spouseName: '',
      nomineeName: '',
      nomineeRelation: '',
      nomineePhoto: '',
      nomineeNid: ''
    },
    education: [] as any[],
    experience: [] as any[]
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Quick Random Password / PIN Generator
  const handleGeneratePassword = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData(prev => ({ ...prev, password: randomPin }));
  };

  // Profile field updater
  const handleProfileChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  };

  // Education handlers
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

  // Experience handlers
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

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      let payload: any = {
        ...formData,
        basicSalary: parseFloat(formData.basicSalary) || 0,
        isMember: isMember
      };

      if (collectionMode === 'BASIC') {
        payload.profile = {
          ...formData.profile,
          currentAddress: formData.profile.currentAddress || '',
          mainAddress: formData.profile.mainAddress || formData.profile.currentAddress || ''
        };
        if (!payload.password) {
          payload.password = Math.floor(100000 + Math.random() * 900000).toString();
        }
      }

      let res;
      if (isMember) {
        payload = {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          role: formData.designation,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          joinedAt: formData.joinDate,
        };
        const apiRes = await fetch('/api/hr/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        res = await apiRes.json();
      } else {
        res = await createEmployee(payload);
      }

      if (res && res.error) {
        throw new Error(res.error);
      }

      if (isMember) {
        if (pathname.includes('/staff-management')) {
          router.push('/erp/staff-management/employees');
        } else {
          router.push('/erp/hr/members');
        }
      } else {
        if (pathname.includes('/staff-management')) {
          router.push('/erp/staff-management/employees');
        } else {
          router.push('/erp/hr/employees');
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to create profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate live completion progress
  const completionPercentage = useMemo(() => {
    if (collectionMode === 'BASIC') {
      const basicTracked = [
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.phone,
        formData.profile.currentAddress,
        formData.basicSalary,
        formData.joinDate,
        formData.password
      ];
      const filled = basicTracked.filter(Boolean).length;
      return Math.round((filled / basicTracked.length) * 100);
    }

    const tracked = [
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.password,
      formData.basicSalary,
      formData.phone,
      formData.departmentId || formData.department,
      formData.designationId || formData.designation,
      formData.profile.nationalId,
      formData.profile.dateOfBirth,
    ];
    const filled = tracked.filter(Boolean).length;
    return Math.round((filled / tracked.length) * 100);
  }, [formData, collectionMode]);

  // Initials for avatar preview
  const employeeInitials = useMemo(() => {
    const f = (formData.firstName || '').trim()[0] || '';
    const l = (formData.lastName || '').trim()[0] || '';
    return (f + l).toUpperCase() || 'EMP';
  }, [formData.firstName, formData.lastName]);

  const fullNameDisplay = useMemo(() => {
    const name = `${formData.firstName} ${formData.lastName}`.trim();
    return name || (isMember ? 'New Member Record' : 'New Employee Record');
  }, [formData.firstName, formData.lastName, isMember]);

  return (
    <div className={styles.pageContainer}>
      {/* Executive Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.backBtn}
            title="Go back"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
          </button>

          <div className={styles.titleArea}>
            <div className={styles.titleRow}>
              <h1 className={styles.pageTitle}>
                {isMember ? 'Onboard New Member' : 'Onboard New Employee'}
              </h1>
              <span className={styles.statusTag}>DRAFT RECORD</span>
              <span className={collectionMode === 'BASIC' ? styles.badgeBasicPill : styles.badgeProPill}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                  {collectionMode === 'BASIC' ? 'bolt' : 'workspace_premium'}
                </span>
                {collectionMode === 'BASIC' ? 'Basic Intake (7 Fields)' : 'Professional Dossier'}
              </span>
            </div>
            <p className={styles.subtitle}>
              {collectionMode === 'BASIC'
                ? 'Minimal data intake: Full Name, Phone, Email, Address, Salary, Join Date, and Staff App PIN.'
                : 'Configure complete enterprise credentials, compensation, qualifications, and onboarding dossier.'}
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.cancelBtn}
            disabled={isSaving}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveProfile}
            className={styles.submitBtn}
            disabled={isSaving}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {isSaving ? 'sync' : 'person_add'}
            </span>
            {isSaving ? "Saving Profile..." : (isMember ? "Create Member" : "Save & Onboard Employee")}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          padding: '14px 20px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13.5px',
          fontWeight: 500
        }}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Section Filter Pills (Only shown in Professional Mode) */}
      {collectionMode === 'PROFESSIONAL' && (
        <div className={styles.sectionTabs}>
          <button
            type="button"
            onClick={() => setActiveTab('core')}
            className={`${styles.sectionTabBtn} ${activeTab === 'core' ? styles.sectionTabBtnActive : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>badge</span>
            Core &amp; Login
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('job')}
            className={`${styles.sectionTabBtn} ${activeTab === 'job' ? styles.sectionTabBtnActive : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>business_center</span>
            Job &amp; Salary
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`${styles.sectionTabBtn} ${activeTab === 'personal' ? styles.sectionTabBtnActive : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
            Personal &amp; Identity
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`${styles.sectionTabBtn} ${activeTab === 'contact' ? styles.sectionTabBtnActive : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
            Contact &amp; Address
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`${styles.sectionTabBtn} ${activeTab === 'bank' ? styles.sectionTabBtnActive : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>account_balance</span>
            Bank &amp; Nominee
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('experience')}
            className={`${styles.sectionTabBtn} ${activeTab === 'experience' ? styles.sectionTabBtnActive : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>school</span>
            Education &amp; Experience
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`${styles.sectionTabBtn} ${activeTab === 'all' ? styles.sectionTabBtnActive : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>list_alt</span>
            View All Fields
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className={styles.mainLayout}>
        {/* Left Column: Form Fields */}
        <form onSubmit={handleSaveProfile} className={styles.formColumn}>

          {/* BASIC MODE: STREAMLINED 7-FIELD ONBOARDING CARD */}
          {collectionMode === 'BASIC' && (
            <div className={styles.formCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconBox} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Basic Employee Information</h3>
                  <p className={styles.cardSubtitle}>
                    Essential operational data to activate staff attendance, mobile app login, and monthly payroll.
                  </p>
                </div>
              </div>

              {/* 1. Full Name */}
              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    First Name <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>person</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanvir"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Last Name <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>person</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ahmed"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Contact: Phone & Email */}
              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Phone Number <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>call</span>
                    <input
                      type="tel"
                      required
                      placeholder="+880 1712-345678"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <span className={styles.inputHelper}>Used for SMS alerts and staff mobile sign-in</span>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Official Email <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>mail</span>
                    <input
                      type="email"
                      required
                      placeholder="tanvir.ahmed@shohoj.com"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <span className={styles.inputHelper}>Workplace communication &amp; notification login</span>
                </div>
              </div>

              {/* 3. Residence Address */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Present Address <span className={styles.requiredAsterisk}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <span className={`material-symbols-outlined ${styles.inputIcon}`}>home_pin</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. House 24, Road 7, Block D, Banani, Dhaka"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    value={formData.profile.currentAddress}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        profile: {
                          ...prev.profile,
                          currentAddress: val,
                          mainAddress: prev.profile.mainAddress || val
                        }
                      }));
                    }}
                  />
                </div>
                <span className={styles.inputHelper}>Current physical dwelling address of the staff member</span>
              </div>

              {/* 4. Compensation & Join Date */}
              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Monthly Salary (BDT ৳) <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>payments</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      placeholder="e.g. 35000"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.basicSalary}
                      onChange={e => setFormData({ ...formData, basicSalary: e.target.value })}
                    />
                  </div>
                  <span className={styles.inputHelper}>Baseline monthly compensation for payroll calculation</span>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Join Date <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>calendar_today</span>
                    <input
                      type="date"
                      required
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.joinDate}
                      onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                    />
                  </div>
                  <span className={styles.inputHelper}>First official date of active employment</span>
                </div>
              </div>

              {/* 5. Staff App Credentials */}
              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Staff App Access PIN / Password <span className={styles.requiredAsterisk}>*</span>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>autorenew</span>
                      Generate 6-Digit PIN
                    </button>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>pin</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="6-digit PIN or password"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.inputActionBtn}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <span className={styles.inputHelper}>Staff signs in to the Shohoj Staff mobile app with this PIN</span>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Custom Employee ID
                    <span style={{ fontSize: '11px', textTransform: 'none', color: 'var(--text-muted)' }}> (Auto-generated if empty)</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>tag</span>
                    <input
                      type="text"
                      placeholder="e.g. EMP-1042"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.employeeId}
                      onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    />
                  </div>
                  <span className={styles.inputHelper}>Badge barcode / identification key</span>
                </div>
              </div>

              {/* Optional Quick Allocation */}
              <div className={styles.grid2} style={{ paddingTop: '10px', borderTop: '1px dashed var(--border-main)' }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Department (Optional)</label>
                  <select
                    className={styles.input}
                    value={formData.departmentId}
                    onChange={e => {
                      const d = departments.find(x => x.id === e.target.value);
                      setFormData({
                        ...formData,
                        departmentId: e.target.value,
                        department: d ? d.name : ''
                      });
                    }}
                  >
                    <option value="">Select Department (Optional)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Designation (Optional)</label>
                  <select
                    className={styles.input}
                    value={formData.designationId}
                    onChange={e => {
                      const d = designations.find(x => x.id === e.target.value);
                      setFormData({
                        ...formData,
                        designationId: e.target.value,
                        designation: d ? d.name : ''
                      });
                    }}
                  >
                    <option value="">Select Designation (Optional)</option>
                    {designations.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: CORE CREDENTIALS (Only in Professional Mode) */}
          {collectionMode === 'PROFESSIONAL' && (activeTab === 'core' || activeTab === 'all') && (
            <div className={styles.formCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconBox}>
                  <span className="material-symbols-outlined">badge</span>
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Core Identity &amp; App Login</h3>
                  <p className={styles.cardSubtitle}>
                    Official workforce identification, name, and Shohoj Staff mobile app access PIN.
                  </p>
                </div>
              </div>

              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    First Name <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>person</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Last Name <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>person</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Doe"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Official Email <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>mail</span>
                    <input
                      type="email"
                      required
                      placeholder="john.doe@shohoj.com"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Custom Employee ID
                    <span style={{ fontSize: '11px', textTransform: 'none', color: 'var(--text-muted)' }}>(Optional &bull; Auto-generated if blank)</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>tag</span>
                    <input
                      type="text"
                      placeholder="e.g. EMP-1002"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.employeeId}
                      onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    App Access PIN / Password <span className={styles.requiredAsterisk}>*</span>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'none'
                      }}
                    >
                      ⚡ Generate PIN
                    </button>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="e.g. 123456"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  <span className={styles.inputHelper}>Used to authenticate in the Shohoj Staff Android ESS application</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: HR & DEPARTMENTAL INFO */}
          {(activeTab === 'job' || activeTab === 'all') && (
            <div className={styles.formCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconBox}>
                  <span className="material-symbols-outlined">business_center</span>
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Department, Role &amp; Compensation</h3>
                  <p className={styles.cardSubtitle}>
                    Assign organizational department, job designation, monthly compensation, and work shift.
                  </p>
                </div>
              </div>

              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Department</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>corporate_fare</span>
                    <select
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.departmentId}
                      onChange={(e) => {
                        const dept = departments.find(d => d.id === e.target.value);
                        setFormData({
                          ...formData,
                          departmentId: e.target.value,
                          department: dept?.name || formData.department
                        });
                      }}
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Designation</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>work</span>
                    <select
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.designationId}
                      onChange={(e) => {
                        const des = designations.find(d => d.id === e.target.value);
                        setFormData({
                          ...formData,
                          designationId: e.target.value,
                          designation: des?.name || formData.designation
                        });
                      }}
                    >
                      <option value="">-- Select Designation --</option>
                      {designations.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Basic Salary (BDT ৳) <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>payments</span>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 45000"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.basicSalary}
                      onChange={e => setFormData({ ...formData, basicSalary: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Date of Joining</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>calendar_today</span>
                    <input
                      type="date"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.joinDate}
                      onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Employment Type</label>
                  <select
                    className={styles.input}
                    value={formData.employmentType}
                    onChange={e => setFormData({ ...formData, employmentType: e.target.value })}
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Employment Status</label>
                  <select
                    className={styles.input}
                    value={formData.employmentStatus}
                    onChange={e => setFormData({ ...formData, employmentStatus: e.target.value })}
                  >
                    <option value="Probation">Probationary</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Notice_Period">Notice Period</option>
                  </select>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Work Location</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>location_on</span>
                    <input
                      type="text"
                      placeholder="e.g. Headquarters / Gulshan Office"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Assigned Shift</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>schedule</span>
                    <input
                      type="text"
                      placeholder="e.g. General Shift (09:00 - 18:00)"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.shift}
                      onChange={e => setFormData({ ...formData, shift: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: PERSONAL INFORMATION */}
          {(activeTab === 'personal' || activeTab === 'all') && (
            <div className={styles.formCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconBox}>
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Personal Dossier &amp; Identity</h3>
                  <p className={styles.cardSubtitle}>
                    National ID, blood group, demographics, and profile picture avatar.
                  </p>
                </div>
              </div>

              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Date of Birth</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={formData.profile.dateOfBirth}
                    onChange={e => handleProfileChange('dateOfBirth', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Gender</label>
                  <select
                    className={styles.input}
                    value={formData.profile.gender}
                    onChange={e => handleProfileChange('gender', e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Blood Group</label>
                  <select
                    className={styles.input}
                    value={formData.profile.bloodGroup}
                    onChange={e => handleProfileChange('bloodGroup', e.target.value)}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>National ID (NID)</label>
                  <input
                    type="text"
                    placeholder="e.g. 19941234567890"
                    className={styles.input}
                    value={formData.profile.nationalId}
                    onChange={e => handleProfileChange('nationalId', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Marital Status</label>
                  <select
                    className={styles.input}
                    value={formData.profile.maritalStatus}
                    onChange={e => handleProfileChange('maritalStatus', e.target.value)}
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Photo URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className={styles.input}
                    value={formData.profile.photo}
                    onChange={e => handleProfileChange('photo', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: CONTACT INFORMATION */}
          {(activeTab === 'contact' || activeTab === 'all') && (
            <div className={styles.formCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconBox}>
                  <span className="material-symbols-outlined">call</span>
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Contact Details &amp; Addresses</h3>
                  <p className={styles.cardSubtitle}>
                    Primary mobile phone, emergency secondary contact, and residential addresses.
                  </p>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Primary Phone Number</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>phone</span>
                    <input
                      type="tel"
                      placeholder="+880 1700-000000"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Secondary / Emergency Phone</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>contact_phone</span>
                    <input
                      type="tel"
                      placeholder="+880 1800-000000"
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={formData.profile.secondaryPhone}
                      onChange={e => handleProfileChange('secondaryPhone', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Present / Current Address</label>
                  <textarea
                    rows={2}
                    placeholder="Apartment, Road, Area, City"
                    className={styles.input}
                    style={{ resize: 'vertical' }}
                    value={formData.profile.currentAddress}
                    onChange={e => handleProfileChange('currentAddress', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Permanent / Main Address</label>
                  <textarea
                    rows={2}
                    placeholder="Village, Post Office, District"
                    className={styles.input}
                    style={{ resize: 'vertical' }}
                    value={formData.profile.mainAddress}
                    onChange={e => handleProfileChange('mainAddress', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: FINANCIAL & NOMINEE */}
          {(activeTab === 'bank' || activeTab === 'all') && (
            <div className={styles.formCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconBox}>
                  <span className="material-symbols-outlined">account_balance</span>
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Bank Details &amp; Family Nominee</h3>
                  <p className={styles.cardSubtitle}>
                    Salary disbursement account info and primary beneficiary nomination.
                  </p>
                </div>
              </div>

              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dutch-Bangla Bank, BRAC"
                    className={styles.input}
                    value={formData.profile.bankName}
                    onChange={e => handleProfileChange('bankName', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    className={styles.input}
                    value={formData.profile.accountName}
                    onChange={e => handleProfileChange('accountName', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 104.120.987654"
                    className={styles.input}
                    value={formData.profile.accountNumber}
                    onChange={e => handleProfileChange('accountNumber', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.grid3} style={{ marginTop: '8px' }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Father's Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.profile.fatherName}
                    onChange={e => handleProfileChange('fatherName', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Mother's Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.profile.motherName}
                    onChange={e => handleProfileChange('motherName', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Spouse Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.profile.spouseName}
                    onChange={e => handleProfileChange('spouseName', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.grid3} style={{ marginTop: '8px' }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Nominee Name</label>
                  <input
                    type="text"
                    placeholder="Full legal name"
                    className={styles.input}
                    value={formData.profile.nomineeName}
                    onChange={e => handleProfileChange('nomineeName', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Relationship</label>
                  <input
                    type="text"
                    placeholder="e.g. Spouse, Brother, Mother"
                    className={styles.input}
                    value={formData.profile.nomineeRelation}
                    onChange={e => handleProfileChange('nomineeRelation', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Nominee NID</label>
                  <input
                    type="text"
                    placeholder="National ID of Nominee"
                    className={styles.input}
                    value={formData.profile.nomineeNid}
                    onChange={e => handleProfileChange('nomineeNid', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: EDUCATION & EXPERIENCE */}
          {(activeTab === 'experience' || activeTab === 'all') && (
            <div className={styles.formCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconBox}>
                  <span className="material-symbols-outlined">school</span>
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Academic Background &amp; Work History</h3>
                  <p className={styles.cardSubtitle}>
                    Verified degrees, university certificates, and prior industry experience.
                  </p>
                </div>
              </div>

              {/* Education Sub-Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className={styles.repeaterHeader}>
                  <h4 className={styles.repeaterTitle}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>history_edu</span>
                    Educational Qualifications
                  </h4>
                  <button type="button" onClick={handleAddEducation} className={styles.addSmallBtn}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                    Add Degree
                  </button>
                </div>

                {formData.education.length === 0 ? (
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--surface-hover)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No educational records added yet. Click "+ Add Degree" to attach degrees.
                  </div>
                ) : (
                  formData.education.map((edu: any, index: number) => (
                    <div key={index} className={styles.repeaterItemCard}>
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(index)}
                        className={styles.removeRepeaterBtn}
                        title="Remove degree"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>

                      <div className={styles.grid3}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Degree / Certificate</label>
                          <input
                            type="text"
                            placeholder="e.g. B.Sc. in Computer Science"
                            className={styles.input}
                            value={edu.degree}
                            onChange={e => handleEducationChange(index, 'degree', e.target.value)}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Institution / College</label>
                          <input
                            type="text"
                            placeholder="e.g. Dhaka University"
                            className={styles.input}
                            value={edu.institution}
                            onChange={e => handleEducationChange(index, 'institution', e.target.value)}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Board / University</label>
                          <input
                            type="text"
                            placeholder="e.g. National Board"
                            className={styles.input}
                            value={edu.board}
                            onChange={e => handleEducationChange(index, 'board', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className={styles.grid3}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Major / Subject</label>
                          <input
                            type="text"
                            placeholder="e.g. Software Engineering"
                            className={styles.input}
                            value={edu.subject}
                            onChange={e => handleEducationChange(index, 'subject', e.target.value)}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>GPA / Result</label>
                          <input
                            type="text"
                            placeholder="e.g. 3.85 / 4.00"
                            className={styles.input}
                            value={edu.result}
                            onChange={e => handleEducationChange(index, 'result', e.target.value)}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Passing Year</label>
                          <input
                            type="number"
                            placeholder="e.g. 2021"
                            className={styles.input}
                            value={edu.passingYear}
                            onChange={e => handleEducationChange(index, 'passingYear', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Experience Sub-Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                <div className={styles.repeaterHeader}>
                  <h4 className={styles.repeaterTitle}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>work_history</span>
                    Previous Work Experience
                  </h4>
                  <button type="button" onClick={handleAddExperience} className={styles.addSmallBtn}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                    Add Past Job
                  </button>
                </div>

                {formData.experience.length === 0 ? (
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--surface-hover)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No past work experience listed. Fresh graduate or first-time applicant.
                  </div>
                ) : (
                  formData.experience.map((exp: any, index: number) => (
                    <div key={index} className={styles.repeaterItemCard}>
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(index)}
                        className={styles.removeRepeaterBtn}
                        title="Remove experience"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>

                      <div className={styles.grid3}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Company Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Acme Technologies Ltd."
                            className={styles.input}
                            value={exp.company}
                            onChange={e => handleExperienceChange(index, 'company', e.target.value)}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Designation / Role</label>
                          <input
                            type="text"
                            placeholder="e.g. Frontend Developer"
                            className={styles.input}
                            value={exp.position}
                            onChange={e => handleExperienceChange(index, 'position', e.target.value)}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Past Salary (BDT ৳)</label>
                          <input
                            type="number"
                            placeholder="e.g. 35000"
                            className={styles.input}
                            value={exp.salary}
                            onChange={e => handleExperienceChange(index, 'salary', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className={styles.grid3}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Joining Date</label>
                          <input
                            type="date"
                            className={styles.input}
                            value={exp.joiningDate ? new Date(exp.joiningDate).toISOString().split('T')[0] : ''}
                            onChange={e => handleExperienceChange(index, 'joiningDate', e.target.value)}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Leaving Date</label>
                          <input
                            type="date"
                            className={styles.input}
                            value={exp.leavingDate ? new Date(exp.leavingDate).toISOString().split('T')[0] : ''}
                            onChange={e => handleExperienceChange(index, 'leavingDate', e.target.value)}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Reason for Leaving</label>
                          <input
                            type="text"
                            placeholder="e.g. Career Growth"
                            className={styles.input}
                            value={exp.reason}
                            onChange={e => handleExperienceChange(index, 'reason', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Bottom Floating Action Bar */}
          <div className={styles.bottomActionBar}>
            <div className={styles.bottomLeftHint}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--success)' }}>verified</span>
              <span>All changes automatically synchronized to payroll &amp; employee registry.</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => router.back()}
                className={styles.cancelBtn}
                disabled={isSaving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSaving}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {isSaving ? 'sync' : 'person_add'}
                </span>
                {isSaving ? "Saving..." : (isMember ? "Create Member" : "Save & Onboard Employee")}
              </button>
            </div>
          </div>
        </form>

        {/* Right Column: Sticky Live Digital Employee Badge */}
        <aside className={styles.previewSticky}>
          <div className={styles.idBadgeCard}>
            <div className={styles.idBadgeTopBanner}>
              <div className={styles.companyWatermark}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>domain</span>
                SHOHOJ LEDGER
              </div>
              <div className={styles.chipWatermark} />
            </div>

            <div className={styles.idBadgeAvatarWrapper}>
              {formData.profile.photo ? (
                <img
                  src={formData.profile.photo}
                  alt={fullNameDisplay}
                  className={styles.idAvatarCircle}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className={styles.idAvatarCircle}>
                  {employeeInitials}
                </div>
              )}
            </div>

            <div className={styles.idBadgeBody}>
              <h3 className={styles.idBadgeName}>{fullNameDisplay}</h3>
              <p className={styles.idBadgeRole}>
                {formData.designation || 'Unassigned Role'}
              </p>

              <span className={styles.idBadgeEmpCode}>
                ID: {formData.employeeId || 'EMP-AUTO'}
              </span>

              <div style={{ margin: '6px 0 10px' }}>
                <span className={collectionMode === 'BASIC' ? styles.badgeBasicPill : styles.badgeProPill}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                    {collectionMode === 'BASIC' ? 'bolt' : 'workspace_premium'}
                  </span>
                  {collectionMode === 'BASIC' ? 'Basic Intake Record' : 'Enterprise Dossier'}
                </span>
              </div>

              <div className={styles.compensationBox}>
                <span className={styles.compensationLabel}>Monthly Compensation</span>
                <span className={styles.compensationAmount}>
                  ৳{formData.basicSalary ? Number(formData.basicSalary).toLocaleString() : '0'}
                </span>
              </div>

              <div className={styles.idBadgeMetaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Department</span>
                  <span className={styles.metaValue}>{formData.department || 'General'}</span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Status</span>
                  <span className={styles.metaValue} style={{ color: 'var(--success)' }}>
                    {formData.employmentStatus}
                  </span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Joining Date</span>
                  <span className={styles.metaValue}>{formData.joinDate || 'Today'}</span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Type</span>
                  <span className={styles.metaValue}>{formData.employmentType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Onboarding Completion Meter */}
          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <span style={{ color: 'var(--text-muted)' }}>Dossier Readiness</span>
              <span style={{ color: 'var(--primary)' }}>{completionPercentage}% Complete</span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
