import React from 'react';
import { ReserveDashboard } from './components/ReserveDashboard';

export default function ReservesPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Corporate Reserves</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Manage restricted and unrestricted equity reserves</p>
        </div>
      </div>
      <ReserveDashboard />
    </div>
  );
}
