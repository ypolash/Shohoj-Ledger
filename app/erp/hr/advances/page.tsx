"use client";

import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default function AdvancesPage() {
  

  return (
    <PageContainer>
      <PageHeader 
        title="Advances" 
        description="Manage enterprise advances records and metrics."
      />
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Advances Overview</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary">
              <span className="material-symbols-outlined">filter_list</span> Filter
            </button>
            <button className="btn btn-primary">
              <span className="material-symbols-outlined">add</span> Create New
            </button>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Employee / ID</th>
                <th>Details</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>groups</span>
                    <p style={{ margin: 0 }}>No advances records found.</p>
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
