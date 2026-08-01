"use client";

import React from 'react';

export function BalanceWidget({ data }: { data?: any }) {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Liquidity Overview</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_balance</span>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Bank Accounts</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>৳ {(data?.kpis?.bank || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--info-glow)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>payments</span>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cash on Hand</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>৳ {(data?.kpis?.cash || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--warning-glow)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>savings</span>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Reserves</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>৳ {(data?.kpis?.reserve || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
