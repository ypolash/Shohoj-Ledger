"use client";

import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default function CustomPage() {
  const [loading, setLoading] = useState(false);

  return (
    <PageContainer>
      <PageHeader 
        title="Custom" 
        description="Enterprise custom metrics, charts, and analysis."
      />
      <div className="glass-card" style={ padding: 'var(--spacing-6)' }>
        <div style={ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }>
          <h2 style={ margin: 0, fontSize: '18px' }>Custom Dashboard</h2>
          <div style={ display: 'flex', gap: '8px' }>
            <button className="btn btn-secondary">
              <span className="material-symbols-outlined">date_range</span> Date Range
            </button>
            <button className="btn btn-primary">
              <span className="material-symbols-outlined">download</span> Export
            </button>
          </div>
        </div>
        
        <div style={ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-5)', marginBottom: 'var(--spacing-6)' }>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={ padding: 'var(--spacing-4)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }>
              <div style={ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }>
                <span style={ color: 'var(--text-muted)', fontSize: '13px' }>Metric {i}</span>
                <span className="material-symbols-outlined" style={ color: 'var(--primary)', fontSize: '18px' }>analytics</span>
              </div>
              <div style={ fontSize: '24px', fontWeight: 'bold' }>--</div>
              <div style={ fontSize: '12px', color: 'var(--success)', marginTop: '4px' }>+0.0% vs last month</div>
            </div>
          ))}
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Category</th>
                <th>Generated</th>
                <th style={ textAlign: 'right' }>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} style={ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--text-muted)' }>
                  <div style={ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }>
                    <span className="material-symbols-outlined" style={ fontSize: '48px', opacity: 0.5 }>query_stats</span>
                    <p style={ margin: 0 }>No custom data available for the selected period.</p>
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
