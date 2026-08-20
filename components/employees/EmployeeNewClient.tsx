"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createEmployee } from "@/app/erp/staff-management/employees/actions";

export default function EmployeeNewClient({ isMember = false }: { isMember?: boolean }) {
  const router = useRouter();
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/departments'),
      fetch('/api/designations')
    ]).then(async ([deptRes, desigRes]) => {
      if(deptRes.ok) setDepartments(await deptRes.json());
      if(desigRes.ok) setDesignations(await desigRes.json());
    }).catch(console.error);
  }, []);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', designation: '', department: '', 
    departmentId: '', designationId: '', reportingManagerId: '', employmentType: 'Full-Time', location: '', shift: '', 
    basicSalary: '', joinDate: new Date().toISOString().split('T')[0], password: '', status: 'ACTIVE',
    profile: {
      dateOfBirth: '', gender: 'Male', bloodGroup: '', nationalId: '', maritalStatus: 'Single', photo: '',
      secondaryPhone: '', currentAddress: '', mainAddress: '', bankName: '', accountName: '', accountNumber: '',
      fatherName: '', motherName: '', spouseName: '', nomineeName: '', nomineeRelation: '', nomineePhoto: '', nomineeNid: ''
    },
    education: [] as any[],
    experience: [] as any[]
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      let payload: any = {
        ...formData,
        basicSalary: parseFloat(formData.basicSalary),
        isMember: isMember
      };
      
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
      
      alert(isMember ? "Member created successfully!" : "Employee created successfully!");
      if (isMember) {
        router.push('/dashboard/staff-management/members');
      } else {
        router.push('/dashboard/staff-management/employees');
      }
    } catch (err: any) {
      setError(err.message || "Failed to create profile.");
    } finally {
      setIsSaving(false);
    }
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

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ margin: 0 }}>{isMember ? 'Add New Member' : 'Add New Employee'}</h1>
        <button onClick={() => router.back()} className="btn btn-secondary">
          Cancel
        </button>
      </div>

      {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '14px' }}>⚠ {error}</div>}

      <form onSubmit={handleSaveProfile} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', padding: '32px' }}>
        
        {/* Core Details */}
        <h3 style={{ margin: 0, color: 'var(--text-main)', borderBottom: '1px solid var(--border-main)', fontSize: '18px', fontWeight: 600, paddingBottom: '8px' }}>Core Credentials</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">First Name *</label><input type="text" className="input" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Last Name *</label><input type="text" className="input" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Email *</label><input type="email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">App Password *</label><input type="text" className="input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required placeholder="e.g. 123456" /></div>
        </div>

        {/* HR & Departmental Use Only */}
        <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-main)', fontSize: '18px', fontWeight: 600, paddingBottom: '8px' }}>HR & Departmental Info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Date of Joining</label><input type="date" className="input" value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="label">Department</label>
            <select className="input" value={formData.departmentId} onChange={(e) => {
              const dept = departments.find(d => d.id === e.target.value);
              setFormData({...formData, departmentId: e.target.value, department: dept?.name || formData.department});
            }}>
              <option value="">None</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="label">Designation</label>
            <select className="input" value={formData.designationId} onChange={(e) => {
              const des = designations.find(d => d.id === e.target.value);
              setFormData({...formData, designationId: e.target.value, designation: des?.name || formData.designation});
            }}>
              <option value="">None</option>
              {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Basic Salary *</label><input type="number" className="input" value={formData.basicSalary} onChange={e => setFormData({...formData, basicSalary: e.target.value})} required /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Work Location</label><input type="text" className="input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Employment Type</label>
            <select className="input" value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})}>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
        </div>

        {/* Personal Information */}
        <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-main)', fontSize: '18px', fontWeight: 600, paddingBottom: '8px' }}>Personal Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Date of Birth</label><input type="date" className="input" value={formData.profile.dateOfBirth} onChange={e => handleProfileChange('dateOfBirth', e.target.value)} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Gender</label>
            <select className="input" value={formData.profile.gender} onChange={e => handleProfileChange('gender', e.target.value)}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Blood Group</label><input type="text" className="input" value={formData.profile.bloodGroup} onChange={e => handleProfileChange('bloodGroup', e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">NID Number</label><input type="text" className="input" value={formData.profile.nationalId} onChange={e => handleProfileChange('nationalId', e.target.value)} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Marital Status</label>
            <select className="input" value={formData.profile.maritalStatus} onChange={e => handleProfileChange('maritalStatus', e.target.value)}>
              <option>Single</option><option>Married</option><option>Divorced</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Photo URL</label><input type="text" className="input" value={formData.profile.photo} onChange={e => handleProfileChange('photo', e.target.value)} /></div>
        </div>

        {/* Contact Information */}
        <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-main)', fontSize: '18px', fontWeight: 600, paddingBottom: '8px' }}>Contact Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Personal Number</label><input type="text" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Secondary Number</label><input type="text" className="input" value={formData.profile.secondaryPhone} onChange={e => handleProfileChange('secondaryPhone', e.target.value)} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Current Address</label><input type="text" className="input" value={formData.profile.currentAddress} onChange={e => handleProfileChange('currentAddress', e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Main Address</label><input type="text" className="input" value={formData.profile.mainAddress} onChange={e => handleProfileChange('mainAddress', e.target.value)} /></div>
        </div>

        {/* Educational Information */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--spacing-4) 0 0 0', borderBottom: '1px solid var(--border-main)', fontSize: '18px', fontWeight: 600, paddingBottom: '8px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Educational Information</h3>
          <button type="button" className="btn btn-secondary" onClick={handleAddEducation} style={{ padding: '4px 12px', fontSize: '13px' }}>+ Add More</button>
        </div>
        {formData.education.map((edu: any, index: number) => (
          <div key={index} style={{ background: 'var(--surface-light)', padding: '16px', borderRadius: '8px', position: 'relative' }}>
            <button type="button" onClick={() => handleRemoveEducation(index)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><span className="material-symbols-outlined">delete</span></button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' , marginBottom: '16px', paddingRight: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Degree Name</label><input type="text" className="input" value={edu.degree} onChange={e => handleEducationChange(index, 'degree', e.target.value)} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Institution</label><input type="text" className="input" value={edu.institution} onChange={e => handleEducationChange(index, 'institution', e.target.value)} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Board/University</label><input type="text" className="input" value={edu.board} onChange={e => handleEducationChange(index, 'board', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Subject</label><input type="text" className="input" value={edu.subject} onChange={e => handleEducationChange(index, 'subject', e.target.value)} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">GPA/CGPA</label><input type="text" className="input" value={edu.result} onChange={e => handleEducationChange(index, 'result', e.target.value)} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Passing Year</label><input type="number" className="input" value={edu.passingYear} onChange={e => handleEducationChange(index, 'passingYear', e.target.value)} /></div>
            </div>
          </div>
        ))}

        {/* Work Experience */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--spacing-4) 0 0 0', borderBottom: '1px solid var(--border-main)', fontSize: '18px', fontWeight: 600, paddingBottom: '8px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Work Experience</h3>
          <button type="button" className="btn btn-secondary" onClick={handleAddExperience} style={{ padding: '4px 12px', fontSize: '13px' }}>+ Add More</button>
        </div>
        {formData.experience.map((exp: any, index: number) => (
          <div key={index} style={{ background: 'var(--surface-light)', padding: '16px', borderRadius: '8px', position: 'relative' }}>
            <button type="button" onClick={() => handleRemoveExperience(index)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><span className="material-symbols-outlined">delete</span></button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' , marginBottom: '16px', paddingRight: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Company Name</label><input type="text" className="input" value={exp.company} onChange={e => handleExperienceChange(index, 'company', e.target.value)} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Designation</label><input type="text" className="input" value={exp.position} onChange={e => handleExperienceChange(index, 'position', e.target.value)} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Salary</label><input type="number" className="input" value={exp.salary} onChange={e => handleExperienceChange(index, 'salary', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Joining Date</label><input type="date" className="input" value={exp.joiningDate ? new Date(exp.joiningDate).toISOString().split('T')[0] : ''} onChange={e => handleExperienceChange(index, 'joiningDate', e.target.value)} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Leaving Date</label><input type="date" className="input" value={exp.leavingDate ? new Date(exp.leavingDate).toISOString().split('T')[0] : ''} onChange={e => handleExperienceChange(index, 'leavingDate', e.target.value)} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Reason for Leaving</label><input type="text" className="input" value={exp.reason} onChange={e => handleExperienceChange(index, 'reason', e.target.value)} /></div>
            </div>
          </div>
        ))}

        {/* Financial & Tax Details */}
        <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-main)', fontSize: '18px', fontWeight: 600, paddingBottom: '8px' }}>Financial & Tax Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Bank Name</label><input type="text" className="input" value={formData.profile.bankName} onChange={e => handleProfileChange('bankName', e.target.value)} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Account Holder Name</label><input type="text" className="input" value={formData.profile.accountName} onChange={e => handleProfileChange('accountName', e.target.value)} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Account Number</label><input type="text" className="input" value={formData.profile.accountNumber} onChange={e => handleProfileChange('accountNumber', e.target.value)} /></div>
        </div>

        {/* Family & Nominee Details */}
        <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-main)', fontSize: '18px', fontWeight: 600, paddingBottom: '8px' }}>Family & Nominee Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Father's Name</label><input type="text" className="input" value={formData.profile.fatherName} onChange={e => handleProfileChange('fatherName', e.target.value)} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Mother's Name</label><input type="text" className="input" value={formData.profile.motherName} onChange={e => handleProfileChange('motherName', e.target.value)} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Spouse Name</label><input type="text" className="input" value={formData.profile.spouseName} onChange={e => handleProfileChange('spouseName', e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Nominee Name</label><input type="text" className="input" value={formData.profile.nomineeName} onChange={e => handleProfileChange('nomineeName', e.target.value)} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Relationship</label><input type="text" className="input" value={formData.profile.nomineeRelation} onChange={e => handleProfileChange('nomineeRelation', e.target.value)} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Nominee NID</label><input type="text" className="input" value={formData.profile.nomineeNid} onChange={e => handleProfileChange('nomineeNid', e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label className="label">Nominee Photo URL</label><input type="text" className="input" value={formData.profile.nomineePhoto} onChange={e => handleProfileChange('nomineePhoto', e.target.value)} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-6)' }}>
          <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ padding: '12px 24px', fontSize: '16px' }}>
            {isSaving ? "Saving..." : (isMember ? "Create Member" : "Create Employee")}
          </button>
        </div>
      </form>
    </div>
  );
}
