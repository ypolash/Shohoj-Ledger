import React from 'react';
import { TabProps } from './types';

interface EducationTabProps extends TabProps {
  handleAddEducation: () => void;
  handleRemoveEducation: (index: number) => void;
  handleEducationChange: (index: number, field: string, value: any) => void;
}

export default function EducationTab({ formData, isEditing, handleAddEducation, handleRemoveEducation, handleEducationChange }: EducationTabProps) {
  if (!isEditing) {
    return (
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Education</h3>
        {formData.education.length > 0 ? (
          <div style={{ position: 'relative', paddingLeft: '16px', borderLeft: '2px solid var(--border)' }}>
            {formData.education.map((edu: any, idx: number) => (
              <div key={idx} style={{ position: 'relative', marginBottom: idx === formData.education.length - 1 ? 0 : '24px' }}>
                <div style={{ position: 'absolute', left: '-21px', top: '2px', width: '8px', height: '8px', borderRadius: '50%', background: '#e2e8f0', border: '2px solid #fff' }}></div>
                <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{edu.degree} - {edu.institution}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>{edu.subject || edu.board || '-'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>GPA ({edu.result || '-'})</div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>{edu.passingYear || '-'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)' }}>No education records found.</div>
        )}
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--spacing-4) 0 0 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        <h3 style={{ margin: 0, color: 'var(--primary)' }}>Educational Information</h3>
        <button type="button" className="btn btn-secondary" onClick={handleAddEducation} style={{ padding: '4px 12px', fontSize: '13px' }}>+ Add More</button>
      </div>
      {formData.education.map((edu: any, index: number) => (
        <div key={index} style={{ background: 'var(--surface-light)', padding: '16px', borderRadius: '8px', position: 'relative', marginBottom: '16px' }}>
          <button type="button" onClick={() => handleRemoveEducation(index)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><span className="material-symbols-outlined">delete</span></button>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', paddingRight: '32px' }}>
            <div style={{ flex: 1 }}><label className="label">Degree Name</label><input type="text" className="input" value={edu.degree} onChange={e => handleEducationChange(index, 'degree', e.target.value)} /></div>
            <div style={{ flex: 1 }}><label className="label">Institution</label><input type="text" className="input" value={edu.institution} onChange={e => handleEducationChange(index, 'institution', e.target.value)} /></div>
            <div style={{ flex: 1 }}><label className="label">Board/University</label><input type="text" className="input" value={edu.board} onChange={e => handleEducationChange(index, 'board', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}><label className="label">Subject</label><input type="text" className="input" value={edu.subject} onChange={e => handleEducationChange(index, 'subject', e.target.value)} /></div>
            <div style={{ flex: 1 }}><label className="label">GPA/CGPA</label><input type="text" className="input" value={edu.result} onChange={e => handleEducationChange(index, 'result', e.target.value)} /></div>
            <div style={{ flex: 1 }}><label className="label">Passing Year</label><input type="number" className="input" value={edu.passingYear} onChange={e => handleEducationChange(index, 'passingYear', e.target.value)} /></div>
          </div>
        </div>
      ))}
    </>
  );
}
