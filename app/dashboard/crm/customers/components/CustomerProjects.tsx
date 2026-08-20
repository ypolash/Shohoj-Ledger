"use client";

import React from 'react';
import Link from 'next/link';

export function CustomerProjects() {
  const projects = [
    { id: 'PRJ-101', name: 'ERP Implementation', progress: 65, status: 'In Progress' },
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Active Projects</h4>
        <button style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
          + New Project
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {projects.map(proj => (
          <div key={proj.id} style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--surface-hover)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary)' }}>{proj.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{proj.id}</div>
              </div>
              <span style={{
                padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                background: proj.status === 'In Progress' ? 'var(--info-glow)' : 'var(--success-glow)',
                color: proj.status === 'In Progress' ? 'var(--info)' : 'var(--success)',
              }}>{proj.status}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-main)', marginBottom: '8px' }}>
              <span>Progress</span>
              <span>{proj.progress}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--border-main)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${proj.progress}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
