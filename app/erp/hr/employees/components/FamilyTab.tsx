import React from 'react';
import { TabProps } from './types';

export default function FamilyTab({ formData, setFormData, isEditing, handleProfileChange }: TabProps) {
  if (!isEditing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Emergency / Secondary Contact */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Emergency contact</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <div style={{ fontWeight: 500 }}>Name</div>
              <div style={{ color: 'var(--text-muted)' }}>{formData.profile.nomineeName || '-'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <div style={{ fontWeight: 500 }}>Relationship</div>
              <div style={{ color: 'var(--text-muted)' }}>{formData.profile.nomineeRelation || '-'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <div style={{ fontWeight: 500 }}>Phone number</div>
              <div style={{ color: 'var(--text-muted)' }}>{formData.profile.secondaryPhone || '-'}</div>
            </div>
          </div>
        </div>

        {/* Family Table */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Family</h3>
          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-light)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Family type</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Person name</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Father</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{formData.profile.fatherName || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Mother</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{formData.profile.motherName || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px' }}>Spouse</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{formData.profile.spouseName || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <h3 style={{ margin: 'var(--spacing-4) 0 0 0', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Family & Nominee Details</h3>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">Father's Name</label><input type="text" className="input" value={formData.profile.fatherName} onChange={e => handleProfileChange && handleProfileChange('fatherName', e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="label">Mother's Name</label><input type="text" className="input" value={formData.profile.motherName} onChange={e => handleProfileChange && handleProfileChange('motherName', e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="label">Spouse Name</label><input type="text" className="input" value={formData.profile.spouseName} onChange={e => handleProfileChange && handleProfileChange('spouseName', e.target.value)} /></div>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">Nominee Name</label><input type="text" className="input" value={formData.profile.nomineeName} onChange={e => handleProfileChange && handleProfileChange('nomineeName', e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="label">Relationship</label><input type="text" className="input" value={formData.profile.nomineeRelation} onChange={e => handleProfileChange && handleProfileChange('nomineeRelation', e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="label">Nominee NID</label><input type="text" className="input" value={formData.profile.nomineeNid} onChange={e => handleProfileChange && handleProfileChange('nomineeNid', e.target.value)} /></div>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}><label className="label">Nominee Photo URL</label><input type="text" className="input" value={formData.profile.nomineePhoto} onChange={e => handleProfileChange && handleProfileChange('nomineePhoto', e.target.value)} /></div>
        <div style={{ flex: 1 }}></div>
        <div style={{ flex: 1 }}></div>
      </div>
    </>
  );
}
