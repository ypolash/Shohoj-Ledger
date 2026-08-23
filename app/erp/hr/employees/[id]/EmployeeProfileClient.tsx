"use client";

import React, { useState } from 'react';
import styles from "../../../income/page.module.css";
import { updateExtendedProfile, saveDocumentMetadata, saveNote } from "./actions";

export default function EmployeeProfileClient({ employee }: { employee: any }) {
  const [activeTab, setActiveTab] = useState("Profile");
  const [isEditing, setIsEditing] = useState(false);
  const [lifecycles, setLifecycles] = useState<any[]>([]);
  const [isLifecycleModalOpen, setIsLifecycleModalOpen] = useState(false);
  const [newLifecycle, setNewLifecycle] = useState({ eventType: 'HIRE', effectiveDate: new Date().toISOString().split('T')[0], description: '' });

  React.useEffect(() => {
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
  
  // Extended Form State (Mapped to Prisma fields where possible, localized where schema lacks)
  const [formData, setFormData] = useState({
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    email: employee.email || '',
    phone: employee.phone || '',
    designation: employee.designation || '',
    department: employee.department || '',
    basicSalary: employee.basicSalary || '',
    status: employee.status || '',
    employeeId: employee.employeeId || '',
    joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '',
    location: employee.location || '',
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
      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setIsSaving(false);
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

  const getInitials = (f: string, l: string) => `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase();

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
    <div className="animate-fade-in">
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left Sidebar (Picture & Basic Info) */}
        <div style={{ flex: '1 1 300px', maxWidth: '350px', position: 'sticky', top: '24px' }}>
          <div className="glass-card" style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '40px', fontWeight: 'bold', color: '#fff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              {getInitials(employee.firstName, employee.lastName)}
            </div>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>{employee.firstName} {employee.lastName}</h1>
              <div style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '15px', marginBottom: '12px' }}>
                {employee.designation}
                {employee.department && <><br/>{employee.department}</>}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                ID: {employee.employeeId}
              </div>
              <span className={`${styles.badge} ${
                employee.status === 'ACTIVE' ? styles['badge-paid'] : 
                employee.status === 'ON_LEAVE' ? styles['badge-partial'] : styles['badge-unpaid']
              }`}>
                {employee.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right Content Area (Tabs & Details) */}
        <div style={{ flex: '2 1 600px', minWidth: 0 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-6)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t)}
                style={{ 
                  padding: '12px 24px', 
                  background: 'none', 
                  border: 'none', 
                  borderBottom: activeTab === t ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === t ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: activeTab === t ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                {t}
              </button>
            ))}
          </div>

      {/* Profile Tab */}
      {activeTab === "Profile" && (
        <div className="glass-card" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
            <button type="button" onClick={() => setIsEditing(!isEditing)} className={isEditing ? "btn btn-secondary" : "btn btn-primary"} style={{ padding: '6px 12px', fontSize: '13px' }}>
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>

          {!isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', marginTop: '24px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Personal Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>First Name</div><div style={{ fontWeight: 500 }}>{formData.firstName || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last Name</div><div style={{ fontWeight: 500 }}>{formData.lastName || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date of Birth</div><div style={{ fontWeight: 500 }}>{formData.profile.dateOfBirth || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gender</div><div style={{ fontWeight: 500 }}>{formData.profile.gender || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Blood Group</div><div style={{ fontWeight: 500 }}>{formData.profile.bloodGroup || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>NID Number</div><div style={{ fontWeight: 500 }}>{formData.profile.nationalId || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Marital Status</div><div style={{ fontWeight: 500 }}>{formData.profile.maritalStatus || '-'}</div></div>
                </div>
              </div>

              <div>
                <h3 style={{ margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Contact Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Personal Number</div><div style={{ fontWeight: 500 }}>{formData.phone || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secondary Number</div><div style={{ fontWeight: 500 }}>{formData.profile.secondaryPhone || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Personal Email</div><div style={{ fontWeight: 500 }}>{formData.email || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Address</div><div style={{ fontWeight: 500 }}>{formData.profile.currentAddress || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Main Address</div><div style={{ fontWeight: 500 }}>{formData.profile.mainAddress || '-'}</div></div>
                </div>
              </div>

              {formData.education.length > 0 && (
                <div>
                  <h3 style={{ margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Educational Information</h3>
                  {formData.education.map((edu: any, idx: number) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', background: 'var(--surface-light)', padding: '16px', borderRadius: '8px', marginBottom: '8px' }}>
                      <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Degree</div><div style={{ fontWeight: 500 }}>{edu.degree || '-'}</div></div>
                      <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Institution</div><div style={{ fontWeight: 500 }}>{edu.institution || '-'}</div></div>
                      <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Board</div><div style={{ fontWeight: 500 }}>{edu.board || '-'}</div></div>
                      <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Passing Year</div><div style={{ fontWeight: 500 }}>{edu.passingYear || '-'}</div></div>
                      <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Result</div><div style={{ fontWeight: 500 }}>{edu.result || '-'}</div></div>
                    </div>
                  ))}
                </div>
              )}

              {formData.experience.length > 0 && (
                <div>
                  <h3 style={{ margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Work Experience</h3>
                  {formData.experience.map((exp: any, idx: number) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', background: 'var(--surface-light)', padding: '16px', borderRadius: '8px', marginBottom: '8px' }}>
                      <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Company</div><div style={{ fontWeight: 500 }}>{exp.company || '-'}</div></div>
                      <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Designation</div><div style={{ fontWeight: 500 }}>{exp.position || '-'}</div></div>
                      <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Salary</div><div style={{ fontWeight: 500 }}>{exp.salary || '-'}</div></div>
                      <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Duration</div><div style={{ fontWeight: 500 }}>{(exp.joiningDate ? new Date(exp.joiningDate).toLocaleDateString() : '')} - {(exp.leavingDate ? new Date(exp.leavingDate).toLocaleDateString() : 'Present')}</div></div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h3 style={{ margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Financial & Family</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bank Name</div><div style={{ fontWeight: 500 }}>{formData.profile.bankName || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Account Name</div><div style={{ fontWeight: 500 }}>{formData.profile.accountName || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Account Number</div><div style={{ fontWeight: 500 }}>{formData.profile.accountNumber || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Father's Name</div><div style={{ fontWeight: 500 }}>{formData.profile.fatherName || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mother's Name</div><div style={{ fontWeight: 500 }}>{formData.profile.motherName || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Spouse Name</div><div style={{ fontWeight: 500 }}>{formData.profile.spouseName || '-'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nominee Name</div><div style={{ fontWeight: 500 }}>{formData.profile.nomineeName || '-'}</div></div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', marginTop: '24px' }}>
              
              {/* Personal Information */}
          <h3 style={{ margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Personal Information</h3>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}><label className="label">First Name *</label><input type="text" className="input" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required /></div>
            <div className={styles.filterGroup}><label className="label">Last Name *</label><input type="text" className="input" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required /></div>
            <div className={styles.filterGroup}><label className="label">Date of Birth</label><input type="date" className="input" value={formData.profile.dateOfBirth} onChange={e => handleProfileChange('dateOfBirth', e.target.value)} /></div>
          </div>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}><label className="label">Gender</label>
              <select className="input" value={formData.profile.gender} onChange={e => handleProfileChange('gender', e.target.value)}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className={styles.filterGroup}><label className="label">Blood Group</label><input type="text" className="input" value={formData.profile.bloodGroup} onChange={e => handleProfileChange('bloodGroup', e.target.value)} /></div>
            <div className={styles.filterGroup}><label className="label">NID Number</label><input type="text" className="input" value={formData.profile.nationalId} onChange={e => handleProfileChange('nationalId', e.target.value)} /></div>
          </div>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}><label className="label">Marital Status</label>
              <select className="input" value={formData.profile.maritalStatus} onChange={e => handleProfileChange('maritalStatus', e.target.value)}>
                <option>Single</option><option>Married</option><option>Divorced</option>
              </select>
            </div>
            <div className={styles.filterGroup}><label className="label">Photo URL</label><input type="text" className="input" value={formData.profile.photo} onChange={e => handleProfileChange('photo', e.target.value)} /></div>
            <div className={styles.filterGroup}></div>
          </div>

          {/* Contact Information */}
          <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Contact Information</h3>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}><label className="label">Personal Number</label><input type="text" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            <div className={styles.filterGroup}><label className="label">Secondary Number</label><input type="text" className="input" value={formData.profile.secondaryPhone} onChange={e => handleProfileChange('secondaryPhone', e.target.value)} /></div>
            <div className={styles.filterGroup}><label className="label">Personal Email</label><input type="email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required /></div>
          </div>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}><label className="label">Current Address</label><input type="text" className="input" value={formData.profile.currentAddress} onChange={e => handleProfileChange('currentAddress', e.target.value)} /></div>
            <div className={styles.filterGroup}><label className="label">Main Address</label><input type="text" className="input" value={formData.profile.mainAddress} onChange={e => handleProfileChange('mainAddress', e.target.value)} /></div>
          </div>

          {/* Educational Information */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--spacing-4) 0 0 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>Educational Information</h3>
            <button type="button" className="btn btn-secondary" onClick={handleAddEducation} style={{ padding: '4px 12px', fontSize: '13px' }}>+ Add More</button>
          </div>
          {formData.education.map((edu: any, index: number) => (
            <div key={index} style={{ background: 'var(--surface-light)', padding: '16px', borderRadius: '8px', position: 'relative' }}>
              <button type="button" onClick={() => handleRemoveEducation(index)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><span className="material-symbols-outlined">delete</span></button>
              <div className={styles.filtersRow} style={{ marginBottom: '16px', paddingRight: '32px' }}>
                <div className={styles.filterGroup}><label className="label">Degree Name</label><input type="text" className="input" value={edu.degree} onChange={e => handleEducationChange(index, 'degree', e.target.value)} /></div>
                <div className={styles.filterGroup}><label className="label">Institution</label><input type="text" className="input" value={edu.institution} onChange={e => handleEducationChange(index, 'institution', e.target.value)} /></div>
                <div className={styles.filterGroup}><label className="label">Board/University</label><input type="text" className="input" value={edu.board} onChange={e => handleEducationChange(index, 'board', e.target.value)} /></div>
              </div>
              <div className={styles.filtersRow}>
                <div className={styles.filterGroup}><label className="label">Subject</label><input type="text" className="input" value={edu.subject} onChange={e => handleEducationChange(index, 'subject', e.target.value)} /></div>
                <div className={styles.filterGroup}><label className="label">GPA/CGPA</label><input type="text" className="input" value={edu.result} onChange={e => handleEducationChange(index, 'result', e.target.value)} /></div>
                <div className={styles.filterGroup}><label className="label">Passing Year</label><input type="number" className="input" value={edu.passingYear} onChange={e => handleEducationChange(index, 'passingYear', e.target.value)} /></div>
              </div>
            </div>
          ))}

          {/* Work Experience */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--spacing-4) 0 0 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>Work Experience</h3>
            <button type="button" className="btn btn-secondary" onClick={handleAddExperience} style={{ padding: '4px 12px', fontSize: '13px' }}>+ Add More</button>
          </div>
          {formData.experience.map((exp: any, index: number) => (
            <div key={index} style={{ background: 'var(--surface-light)', padding: '16px', borderRadius: '8px', position: 'relative' }}>
              <button type="button" onClick={() => handleRemoveExperience(index)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><span className="material-symbols-outlined">delete</span></button>
              <div className={styles.filtersRow} style={{ marginBottom: '16px', paddingRight: '32px' }}>
                <div className={styles.filterGroup}><label className="label">Company Name</label><input type="text" className="input" value={exp.company} onChange={e => handleExperienceChange(index, 'company', e.target.value)} /></div>
                <div className={styles.filterGroup}><label className="label">Designation</label><input type="text" className="input" value={exp.position} onChange={e => handleExperienceChange(index, 'position', e.target.value)} /></div>
                <div className={styles.filterGroup}><label className="label">Salary</label><input type="number" className="input" value={exp.salary} onChange={e => handleExperienceChange(index, 'salary', e.target.value)} /></div>
              </div>
              <div className={styles.filtersRow}>
                <div className={styles.filterGroup}><label className="label">Joining Date</label><input type="date" className="input" value={exp.joiningDate ? new Date(exp.joiningDate).toISOString().split('T')[0] : ''} onChange={e => handleExperienceChange(index, 'joiningDate', e.target.value)} /></div>
                <div className={styles.filterGroup}><label className="label">Leaving Date</label><input type="date" className="input" value={exp.leavingDate ? new Date(exp.leavingDate).toISOString().split('T')[0] : ''} onChange={e => handleExperienceChange(index, 'leavingDate', e.target.value)} /></div>
                <div className={styles.filterGroup}><label className="label">Reason for Leaving</label><input type="text" className="input" value={exp.reason} onChange={e => handleExperienceChange(index, 'reason', e.target.value)} /></div>
              </div>
            </div>
          ))}

          {/* Financial & Tax Details */}
          <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Financial & Tax Details</h3>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}><label className="label">Bank Name</label><input type="text" className="input" value={formData.profile.bankName} onChange={e => handleProfileChange('bankName', e.target.value)} /></div>
            <div className={styles.filterGroup}><label className="label">Account Holder Name</label><input type="text" className="input" value={formData.profile.accountName} onChange={e => handleProfileChange('accountName', e.target.value)} /></div>
            <div className={styles.filterGroup}><label className="label">Account Number</label><input type="text" className="input" value={formData.profile.accountNumber} onChange={e => handleProfileChange('accountNumber', e.target.value)} /></div>
          </div>

          {/* Family & Nominee Details */}
          <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Family & Nominee Details</h3>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}><label className="label">Father's Name</label><input type="text" className="input" value={formData.profile.fatherName} onChange={e => handleProfileChange('fatherName', e.target.value)} /></div>
            <div className={styles.filterGroup}><label className="label">Mother's Name</label><input type="text" className="input" value={formData.profile.motherName} onChange={e => handleProfileChange('motherName', e.target.value)} /></div>
            <div className={styles.filterGroup}><label className="label">Spouse Name</label><input type="text" className="input" value={formData.profile.spouseName} onChange={e => handleProfileChange('spouseName', e.target.value)} /></div>
          </div>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}><label className="label">Nominee Name</label><input type="text" className="input" value={formData.profile.nomineeName} onChange={e => handleProfileChange('nomineeName', e.target.value)} /></div>
            <div className={styles.filterGroup}><label className="label">Relationship</label><input type="text" className="input" value={formData.profile.nomineeRelation} onChange={e => handleProfileChange('nomineeRelation', e.target.value)} /></div>
            <div className={styles.filterGroup}><label className="label">Nominee NID</label><input type="text" className="input" value={formData.profile.nomineeNid} onChange={e => handleProfileChange('nomineeNid', e.target.value)} /></div>
          </div>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}><label className="label">Nominee Photo URL</label><input type="text" className="input" value={formData.profile.nomineePhoto} onChange={e => handleProfileChange('nomineePhoto', e.target.value)} /></div>
            <div className={styles.filterGroup}></div>
            <div className={styles.filterGroup}></div>
          </div>

          {/* HR & Departmental Use Only */}
          <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>HR & Departmental Use Only</h3>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}><label className="label">Employee ID</label><input type="text" className="input" value={formData.employeeId} readOnly disabled style={{ background: 'var(--surface-light)' }} /></div>
            <div className={styles.filterGroup}><label className="label">Date of Joining</label><input type="date" className="input" value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} /></div>
            <div className={styles.filterGroup}><label className="label">Department</label><input type="text" className="input" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} /></div>
          </div>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}><label className="label">Designation</label><input type="text" className="input" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} /></div>
            <div className={styles.filterGroup}><label className="label">Work Location</label><input type="text" className="input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
            <div className={styles.filterGroup}><label className="label">Basic Salary</label><input type="number" className="input" value={formData.basicSalary} onChange={e => setFormData({...formData, basicSalary: e.target.value})} required /></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-6)' }}>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Saving Profile..." : "Save Profile"}
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
      </div>

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
