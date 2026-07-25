import React from 'react';
import { ExportToolbar } from '../components/ExportToolbar';
import { ReportFilters } from '../components/ReportFilters';

export default function AgingReportPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <ExportToolbar title="A/R & A/P Aging Summary" />
      <ReportFilters />
      
      <div className="glass-card" style={{ borderRadius: '12px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '16px', fontWeight: 600 }}>Customer / Vendor</th>
              <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Current</th>
              <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>1-30 Days</th>
              <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>31-60 Days</th>
              <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>61-90 Days</th>
              <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>&gt; 90 Days</th>
              <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '13px' }}>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-main)' }}>Wayne Enterprises</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>500,000</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
              <td style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right', color: 'var(--warning)' }}>250,000</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
              <td style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', color: 'var(--primary)' }}>750,000</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-main)' }}>Property Mgmt Inc</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>0</td>
              <td style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right', color: 'var(--danger)' }}>(150,000)</td>
              <td style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', color: 'var(--danger)' }}>(150,000)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
