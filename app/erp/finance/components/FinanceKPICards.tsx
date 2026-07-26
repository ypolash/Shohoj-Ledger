"use client";

import React from 'react';

interface KPI {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: string;
  color: string;
}

export function FinanceKPICards() {
  const kpis: KPI[] = [
    { title: 'Total Revenue', value: '৳ 14.5M', trend: '+12%', trendUp: true, icon: 'account_balance_wallet', color: 'var(--primary)' },
    { title: 'Total Expenses', value: '৳ 8.2M', trend: '-5%', trendUp: true, icon: 'receipt_long', color: 'var(--success)' },
    { title: 'Net Profit', value: '৳ 6.3M', trend: '+18%', trendUp: true, icon: 'trending_up', color: 'var(--info)' },
    { title: 'Cash Balance', value: '৳ 2.1M', trend: '-2%', trendUp: false, icon: 'payments', color: 'var(--warning)' },
    { title: 'Outstanding Recv', value: '৳ 3.4M', trend: '+4%', trendUp: true, icon: 'move_to_inbox', color: 'var(--primary)' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
      {kpis.map((kpi, idx) => (
        <div key={idx} className="glass-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: `4px solid ${kpi.color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '10px', 
              background: `color-mix(in srgb, ${kpi.color} 15%, transparent)`,
              color: kpi.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined">{kpi.icon}</span>
            </div>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600,
              color: kpi.trendUp ? 'var(--success)' : 'var(--danger)',
              background: kpi.trendUp ? 'var(--success-glow)' : 'var(--danger-glow)',
              padding: '4px 8px', borderRadius: '12px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                {kpi.trendUp ? 'arrow_upward' : 'arrow_downward'}
              </span>
              {kpi.trend}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{kpi.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '4px' }}>{kpi.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
