"use client";

import React from 'react';

export function ReserveDashboard() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
      <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Emergency Fund</div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>৳ 5,000,000</div>
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
          <button style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Deposit</button>
          <button style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Withdraw</button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Tax Provision Reserve</div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--warning)', marginTop: '8px' }}>৳ 2,450,000</div>
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
          <button style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Deposit</button>
          <button style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Withdraw</button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Dividend Reserve</div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--success)', marginTop: '8px' }}>৳ 12,000,000</div>
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
          <button style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Deposit</button>
          <button style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Withdraw</button>
        </div>
      </div>
    </div>
  );
}
