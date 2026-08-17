"use client";

import React from 'react';

export function RevenueWidget({ data }: { data?: any }) {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Total Revenue</h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>This Month</p>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined">payments</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)' }}>৳ {(data?.kpis?.revenue || 0).toLocaleString()}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '13px' }}>
          {data?.trends?.revenue !== undefined ? (
            <>
              <span style={{ color: (data?.trends?.revenue || 0) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  {(data?.trends?.revenue || 0) >= 0 ? 'trending_up' : 'trending_down'}
                </span>
                {(data?.trends?.revenue || 0) > 0 ? '+' : ''}{(data?.trends?.revenue || 0).toFixed(1)}%
              </span>
              <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>No historical data</span>
          )}
        </div>
      </div>
    </div>
  );
}
