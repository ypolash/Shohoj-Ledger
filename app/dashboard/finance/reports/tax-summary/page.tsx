import React from 'react';
import { ExportToolbar } from '../components/ExportToolbar';
import { ReportFilters } from '../components/ReportFilters';

export default function TaxSummaryPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <ExportToolbar title="Tax Summary Report" />
      <ReportFilters />
      
      <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--border-main)', marginBottom: '16px' }}>request_quote</span>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>Tax Engine Offline</h3>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>The tax calculation engine is not configured for the selected period.</p>
      </div>
    </div>
  );
}
