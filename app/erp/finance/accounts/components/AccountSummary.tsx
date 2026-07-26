"use client";

import React from 'react';
import { AccountTypeBadge } from './AccountTypeBadge';

export function AccountSummary() {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            City Bank (Main)
            <AccountTypeBadge type="Asset" />
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>Code: <strong style={{ color: 'var(--primary)' }}>1000-02</strong></p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Balance</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>৳ 4,500,000</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Parent Account</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>Bank Accounts (1000)</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Currency</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>BDT</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--success)' }}>Active</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Reconciliation</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>Enabled</div>
        </div>
      </div>
    </div>
  );
}
