"use client";

import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default function UsersPage() {
  const [loading, setLoading] = useState(false);

  return (
    <PageContainer>
      <PageHeader 
        title="Users" 
        description="Configure and manage enterprise users settings."
      />
      <div className="glass-card" style={ padding: 'var(--spacing-6)' }>
        <div style={ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }>
          <h2 style={ margin: 0, fontSize: '18px' }>Users Configuration</h2>
          <div style={ display: 'flex', gap: '8px' }>
            <button className="btn btn-secondary">
              <span className="material-symbols-outlined">refresh</span> Refresh
            </button>
            <button className="btn btn-primary">
              <span className="material-symbols-outlined">save</span> Save Settings
            </button>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Setting Key</th>
                <th>Configuration Value</th>
                <th>Status</th>
                <th>Last Modified</th>
                <th style={ textAlign: 'right' }>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} style={ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--text-muted)' }>
                  <div style={ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }>
                    <span className="material-symbols-outlined" style={ fontSize: '48px', opacity: 0.5 }>settings_applications</span>
                    <p style={ margin: 0 }>No users configurations found.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
