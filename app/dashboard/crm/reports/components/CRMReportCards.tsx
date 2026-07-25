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

interface CRMReportCardsProps {
  kpis?: KPI[];
}

export function CRMReportCards({ kpis }: CRMReportCardsProps) {
  const defaultKPIs: KPI[] = [
    { title: 'Total Leads', value: '1,245', trend: '+12%', trendUp: true, icon: 'group', color: 'var(--primary)' },
    { title: 'Active Opportunities', value: '342', trend: '+5%', trendUp: true, icon: 'lightbulb', color: 'var(--info)' },
    { title: 'Pipeline Value', value: '৳ 45.2M', trend: '-2%', trendUp: false, icon: 'monetization_on', color: 'var(--warning)' },
    { title: 'Won Deals', value: '128', trend: '+18%', trendUp: true, icon: 'emoji_events', color: 'var(--success)' },
    { title: 'Conversion Rate', value: '24.5%', trend: '+1.2%', trendUp: true, icon: 'trending_up', color: 'var(--primary)' }
  ];

  const data = kpis || defaultKPIs;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
      {data.map((kpi, idx) => (
        <div key={idx} className="glass-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: \`4px solid \${kpi.color}\` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '10px', 
              background: \`color-mix(in srgb, \${kpi.color} 15%, transparent)\`,
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
