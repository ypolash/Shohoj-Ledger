"use client";

import React from 'react';

export function SalesFunnelChart() {
  const stages = [
    { name: 'Leads Generated', count: 1200, value: '৳ 120M', color: 'var(--gray-400)' },
    { name: 'Qualified Leads', count: 850, value: '৳ 85M', color: 'var(--info)' },
    { name: 'Proposals Sent', count: 420, value: '৳ 50M', color: 'var(--primary)' },
    { name: 'Negotiation', count: 210, value: '৳ 28M', color: 'var(--warning)' },
    { name: 'Closed Won', count: 128, value: '৳ 18.5M', color: 'var(--success)' }
  ];

  const maxCount = stages[0].count;

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', height: '100%' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Sales Funnel</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        {stages.map((stage, index) => {
          const widthPercent = (stage.count / maxCount) * 100;
          return (
            <div key={stage.name} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <div style={{ width: '140px', textAlign: 'right', paddingRight: '16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                {stage.name}
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ 
                  width: \`\${Math.max(widthPercent, 15)}%\`, 
                  background: stage.color,
                  padding: '10px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '12px',
                  borderRadius: '6px',
                  transition: 'width 1s ease-out'
                }}>
                  {stage.count}
                </div>
              </div>
              <div style={{ width: '100px', paddingLeft: '16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {stage.value}
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
        <div style={{ color: 'var(--text-muted)' }}>Overall Conversion</div>
        <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '18px' }}>10.6%</div>
      </div>
    </div>
  );
}
