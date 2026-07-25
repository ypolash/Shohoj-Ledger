"use client";

import React from 'react';

export function OutstandingWidget() {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Outstanding Summary</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--success-glow)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_downward</span>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Accounts Receivable</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>৳ 3,450,000</div>
            </div>
          </div>
          <button style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-hover)', border: '1px solid var(--border-light)', cursor: 'pointer' }}>View</button>
        </div>

        <div style={{ height: '1px', background: 'var(--border-light)' }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--danger-glow)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_upward</span>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Accounts Payable</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>৳ 1,280,000</div>
            </div>
          </div>
          <button style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-hover)', border: '1px solid var(--border-light)', cursor: 'pointer' }}>View</button>
        </div>
      </div>
    </div>
  );
}
