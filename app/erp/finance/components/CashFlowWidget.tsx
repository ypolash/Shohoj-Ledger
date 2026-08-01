"use client";

import React from 'react';

export function CashFlowWidget({ data }: { data?: any }) {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Operating Cash Flow</h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>This Month</p>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--info-glow)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined">water_drop</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)' }}>৳ {(data?.kpis?.cashFlow || 0).toLocaleString()}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '13px' }}>
          <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
            Healthy
          </span>
        </div>
      </div>
    </div>
  );
}
