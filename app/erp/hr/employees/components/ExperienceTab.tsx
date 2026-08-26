import React from 'react';
import { TabProps } from './types';

interface ExperienceTabProps extends TabProps {
  handleAddExperience: () => void;
  handleRemoveExperience: (index: number) => void;
  handleExperienceChange: (index: number, field: string, value: any) => void;
}

export default function ExperienceTab({ formData, isEditing, handleAddExperience, handleRemoveExperience, handleExperienceChange }: ExperienceTabProps) {
  if (!isEditing) {
    return (
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Work Experience</h3>
        {formData.experience.length > 0 ? (
          <div style={{ position: 'relative', paddingLeft: '16px', borderLeft: '2px solid var(--border)' }}>
            {formData.experience.map((exp: any, idx: number) => (
              <div key={idx} style={{ position: 'relative', marginBottom: idx === formData.experience.length - 1 ? 0 : '24px' }}>
                <div style={{ position: 'absolute', left: '-21px', top: '2px', width: '8px', height: '8px', borderRadius: '50%', background: '#e2e8f0', border: '2px solid #fff' }}></div>
                <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{exp.position} - {exp.company}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>Salary: {exp.salary || '-'}</div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                  {(exp.joiningDate ? new Date(exp.joiningDate).toLocaleDateString() : '')} - {(exp.leavingDate ? new Date(exp.leavingDate).toLocaleDateString() : 'Present')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)' }}>No experience records found.</div>
        )}
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--spacing-4) 0 0 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        <h3 style={{ margin: 0, color: 'var(--primary)' }}>Work Experience</h3>
        <button type="button" className="btn btn-secondary" onClick={handleAddExperience} style={{ padding: '4px 12px', fontSize: '13px' }}>+ Add More</button>
      </div>
      {formData.experience.map((exp: any, index: number) => (
        <div key={index} style={{ background: 'var(--surface-light)', padding: '16px', borderRadius: '8px', position: 'relative', marginBottom: '16px' }}>
          <button type="button" onClick={() => handleRemoveExperience(index)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><span className="material-symbols-outlined">delete</span></button>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', paddingRight: '32px' }}>
            <div style={{ flex: 1 }}><label className="label">Company Name</label><input type="text" className="input" value={exp.company} onChange={e => handleExperienceChange(index, 'company', e.target.value)} /></div>
            <div style={{ flex: 1 }}><label className="label">Designation</label><input type="text" className="input" value={exp.position} onChange={e => handleExperienceChange(index, 'position', e.target.value)} /></div>
            <div style={{ flex: 1 }}><label className="label">Salary</label><input type="number" className="input" value={exp.salary} onChange={e => handleExperienceChange(index, 'salary', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}><label className="label">Joining Date</label><input type="date" className="input" value={exp.joiningDate ? new Date(exp.joiningDate).toISOString().split('T')[0] : ''} onChange={e => handleExperienceChange(index, 'joiningDate', e.target.value)} /></div>
            <div style={{ flex: 1 }}><label className="label">Leaving Date</label><input type="date" className="input" value={exp.leavingDate ? new Date(exp.leavingDate).toISOString().split('T')[0] : ''} onChange={e => handleExperienceChange(index, 'leavingDate', e.target.value)} /></div>
            <div style={{ flex: 1 }}><label className="label">Reason for Leaving</label><input type="text" className="input" value={exp.reason} onChange={e => handleExperienceChange(index, 'reason', e.target.value)} /></div>
          </div>
        </div>
      ))}
    </>
  );
}
