import React from 'react';
import { TabProps } from './types';

export default function PersonalTab({ formData, setFormData, isEditing, employee, handleProfileChange, getInitials }: TabProps) {
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
              <div style={{ fontWeight: 500 }}>Blood type</div>
              <div style={{ color: 'var(--text-muted)' }}>{formData.profile.bloodGroup || '-'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <div style={{ fontWeight: 500 }}>Marital Status</div>
              <div style={{ color: 'var(--text-muted)' }}>{formData.profile.maritalStatus || '-'}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Address Card */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Address</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                  <div style={{ fontWeight: 500 }}>Current address</div>
                  <div style={{ color: 'var(--text-muted)' }}>{formData.profile.currentAddress || '-'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                  <div style={{ fontWeight: 500 }}>Main address</div>
                  <div style={{ color: 'var(--text-muted)' }}>{formData.profile.mainAddress || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Financial & Banking Table */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Financial & Banking</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                  <div style={{ fontWeight: 500 }}>Bank Name</div>
                  <div style={{ color: 'var(--text-muted)' }}>{formData.profile.bankName || '-'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                  <div style={{ fontWeight: 500 }}>Account Name</div>
                  <div style={{ color: 'var(--text-muted)' }}>{formData.profile.accountName || '-'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                  <div style={{ fontWeight: 500 }}>Account Number</div>
                  <div style={{ color: 'var(--text-muted)' }}>{formData.profile.accountNumber || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Personal Information */}
      <h3 style={{ margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Personal Information</h3>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">First Name *</label><input type="text" className="input" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required /></div>
        <div style={{ flex: 1 }}><label className="label">Last Name *</label><input type="text" className="input" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required /></div>
        <div style={{ flex: 1 }}><label className="label">Date of Birth</label><input type="date" className="input" value={formData.profile.dateOfBirth} onChange={e => handleProfileChange && handleProfileChange('dateOfBirth', e.target.value)} /></div>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">Gender</label>
          <select className="input" value={formData.profile.gender} onChange={e => handleProfileChange && handleProfileChange('gender', e.target.value)}>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
        <div style={{ flex: 1 }}><label className="label">Blood Group</label><input type="text" className="input" value={formData.profile.bloodGroup} onChange={e => handleProfileChange && handleProfileChange('bloodGroup', e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="label">NID Number</label><input type="text" className="input" value={formData.profile.nationalId} onChange={e => handleProfileChange && handleProfileChange('nationalId', e.target.value)} /></div>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">Marital Status</label>
          <select className="input" value={formData.profile.maritalStatus} onChange={e => handleProfileChange && handleProfileChange('maritalStatus', e.target.value)}>
            <option>Single</option><option>Married</option><option>Divorced</option>
          </select>
        </div>
        <div style={{ flex: 1 }}><label className="label">Photo URL</label><input type="text" className="input" value={formData.profile.photo} onChange={e => handleProfileChange && handleProfileChange('photo', e.target.value)} /></div>
        <div style={{ flex: 1 }}></div>
      </div>

      {/* Contact Information */}
      <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Contact Information</h3>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">Personal Number</label><input type="text" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
        <div style={{ flex: 1 }}><label className="label">Secondary Number</label><input type="text" className="input" value={formData.profile.secondaryPhone} onChange={e => handleProfileChange && handleProfileChange('secondaryPhone', e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="label">Personal Email</label><input type="email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required /></div>
      </div>
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
        <div style={{ flex: 1 }}><label className="label">Department</label><input type="text" className="input" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} /></div>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">Designation</label><input type="text" className="input" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} /></div>
        <div style={{ flex: 1 }}><label className="label">Work Location</label><input type="text" className="input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
        <div style={{ flex: 1 }}><label className="label">Basic Salary</label><input type="number" className="input" value={formData.basicSalary} onChange={e => setFormData({...formData, basicSalary: e.target.value})} required /></div>
      </div>
    </>
  );
}
