import React, { useState, useEffect } from 'react';
import { TabProps } from './types';

export default function PersonalTab({ formData, setFormData, isEditing, employee, handleProfileChange, getInitials }: TabProps) {
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [designations, setDesignations] = useState<{ id: string; title?: string; name?: string }[]>([]);

  useEffect(() => {
    if (isEditing) {
      Promise.all([
        fetch('/api/departments').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/designations').then(r => r.ok ? r.json() : []).catch(() => [])
      ]).then(([depts, desigs]) => {
        if (Array.isArray(depts)) setDepartments(depts);
        if (Array.isArray(desigs)) setDesignations(desigs);
      });
    }
  }, [isEditing]);

  if (!isEditing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Basic Information Card */}
        <div className="glass-card" style={{ padding: '32px', display: 'flex', gap: '48px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Left Side: Avatar & Name */}
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flex: '1 1 300px' }}>
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '40px', fontWeight: 'bold', color: '#fff',
              flexShrink: 0
            }}>
              {getInitials && getInitials(employee.firstName, employee.lastName)}
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 600 }}>{employee.firstName} {employee.lastName}</h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>{employee.employeeId}</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{formData.profile.gender === 'Female' ? 'female' : 'male'}</span> {formData.profile.gender || '-'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>mail</span> {formData.email || '-'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call</span> {formData.phone || '-'}</div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '150px', background: 'var(--border)', display: 'block' }}></div>

          {/* Right Side: Additional Basic Info */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <div style={{ fontWeight: 500 }}>Department</div>
              <div style={{ color: 'var(--text-muted)' }}>{formData.department || '-'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <div style={{ fontWeight: 500 }}>Designation</div>
              <div style={{ color: 'var(--text-muted)' }}>{formData.designation || '-'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <div style={{ fontWeight: 500 }}>Birth date</div>
              <div style={{ color: 'var(--text-muted)' }}>{formData.profile.dateOfBirth || '-'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <div style={{ fontWeight: 500 }}>Marital Status</div>
              <div style={{ color: 'var(--text-muted)' }}>{formData.profile.maritalStatus || '-'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <div style={{ fontWeight: 500 }}>National ID / NID</div>
              <div style={{ color: 'var(--text-muted)' }}>{formData.profile.nationalId || '-'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <div style={{ fontWeight: 500 }}>Blood Group</div>
              <div style={{ color: 'var(--text-muted)' }}>{formData.profile.bloodGroup || '-'}</div>
            </div>
          </div>
        </div>

        {/* Address Information Card */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Address Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Address</div>
              <div style={{ fontSize: '15px' }}>{formData.profile.currentAddress || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Permanent Address</div>
              <div style={{ fontSize: '15px' }}>{formData.profile.mainAddress || '-'}</div>
            </div>
          </div>
        </div>

        {/* Financial Details Card */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Financial & Bank Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Basic Salary</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary)' }}>৳{Number(formData.basicSalary || 0).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Bank Name</div>
              <div style={{ fontSize: '15px' }}>{formData.profile.bankName || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Account Holder</div>
              <div style={{ fontSize: '15px' }}>{formData.profile.accountName || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Account Number</div>
              <div style={{ fontSize: '15px' }}>{formData.profile.accountNumber || '-'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Basic Employee Details */}
      <h3 style={{ margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Basic Information</h3>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">First Name</label><input type="text" className="input" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required /></div>
        <div style={{ flex: 1 }}><label className="label">Last Name</label><input type="text" className="input" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required /></div>
        <div style={{ flex: 1 }}><label className="label">Father&apos;s Name</label><input type="text" className="input" value={formData.profile.fatherName} onChange={e => handleProfileChange && handleProfileChange('fatherName', e.target.value)} /></div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">Mother&apos;s Name</label><input type="text" className="input" value={formData.profile.motherName} onChange={e => handleProfileChange && handleProfileChange('motherName', e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="label">Spouse Name</label><input type="text" className="input" value={formData.profile.spouseName} onChange={e => handleProfileChange && handleProfileChange('spouseName', e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="label">Date of Birth</label><input type="date" className="input" value={formData.profile.dateOfBirth} onChange={e => handleProfileChange && handleProfileChange('dateOfBirth', e.target.value)} /></div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <label className="label">Gender</label>
          <select className="input" value={formData.profile.gender} onChange={e => handleProfileChange && handleProfileChange('gender', e.target.value)}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">Marital Status</label>
          <select className="input" value={formData.profile.maritalStatus} onChange={e => handleProfileChange && handleProfileChange('maritalStatus', e.target.value)}>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">Blood Group</label>
          <select className="input" value={formData.profile.bloodGroup} onChange={e => handleProfileChange && handleProfileChange('bloodGroup', e.target.value)}>
            <option value="">Select Blood Group</option>
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

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">National ID / NID</label><input type="text" className="input" value={formData.profile.nationalId} onChange={e => handleProfileChange && handleProfileChange('nationalId', e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="label">Primary Email</label><input type="email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required /></div>
        <div style={{ flex: 1 }}><label className="label">Primary Phone</label><input type="tel" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required /></div>
      </div>

      {/* Address Details */}
      <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Address Details</h3>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">Current Address</label><input type="text" className="input" value={formData.profile.currentAddress} onChange={e => handleProfileChange && handleProfileChange('currentAddress', e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="label">Main Address</label><input type="text" className="input" value={formData.profile.mainAddress} onChange={e => handleProfileChange && handleProfileChange('mainAddress', e.target.value)} /></div>
      </div>

      {/* Financial & Tax Details */}
      <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Financial & Tax Details</h3>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">Bank Name</label><input type="text" className="input" value={formData.profile.bankName} onChange={e => handleProfileChange && handleProfileChange('bankName', e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="label">Account Holder Name</label><input type="text" className="input" value={formData.profile.accountName} onChange={e => handleProfileChange && handleProfileChange('accountName', e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="label">Account Number</label><input type="text" className="input" value={formData.profile.accountNumber} onChange={e => handleProfileChange && handleProfileChange('accountNumber', e.target.value)} /></div>
      </div>

      {/* HR & Departmental Use Only */}
      <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>HR & Departmental Use Only</h3>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">Employee ID</label><input type="text" className="input" value={formData.employeeId} readOnly disabled style={{ background: 'var(--surface-light)' }} /></div>
        <div style={{ flex: 1 }}><label className="label">Date of Joining</label><input type="date" className="input" value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} /></div>
        <div style={{ flex: 1 }}>
          <label className="label">Department</label>
          <select
            className="input"
            value={formData.department}
            onChange={e => setFormData({...formData, department: e.target.value})}
          >
            <option value="">Select Department...</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
            {formData.department && !departments.some(d => d.name === formData.department) && (
              <option value={formData.department}>{formData.department}</option>
            )}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <label className="label">Designation</label>
          <select
            className="input"
            value={formData.designation}
            onChange={e => setFormData({...formData, designation: e.target.value})}
          >
            <option value="">Select Designation...</option>
            {designations.map(d => {
              const label = d.title || d.name || '';
              return <option key={d.id} value={label}>{label}</option>;
            })}
            {formData.designation && !designations.some(d => (d.title || d.name) === formData.designation) && (
              <option value={formData.designation}>{formData.designation}</option>
            )}
          </select>
        </div>
        <div style={{ flex: 1 }}><label className="label">Work Location</label><input type="text" className="input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
        <div style={{ flex: 1 }}><label className="label">Basic Salary</label><input type="number" className="input" value={formData.basicSalary} onChange={e => setFormData({...formData, basicSalary: e.target.value})} required /></div>
      </div>
    </>
  );
}
