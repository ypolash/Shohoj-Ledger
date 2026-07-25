"use client";

import React from 'react';

export function PipelineChart() {
  const data = [
    { label: 'Prospecting', value: 35, color: '#9CA3AF' },
    { label: 'Qualification', value: 25, color: '#3B82F6' },
    { label: 'Proposal', value: 20, color: '#8B5CF6' },
    { label: 'Negotiation', value: 15, color: '#F59E0B' },
    { label: 'Closed Won', value: 5, color: '#10B981' }
  ];

  // A very simple SVG pie/doughnut visualization approach using stroke-dasharray
  let currentAngle = 0;
  
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Pipeline by Stage</h3>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '32px', flexWrap: 'wrap' }}>
        <div style={{ width: '160px', height: '160px', position: 'relative' }}>
          <svg viewBox="0 0 32 32" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            {data.map((item, i) => {
              const dash = (item.value / 100) * 100; // Total 100 for SVG circle math
              const dasharray = `${dash} 100`;
              const offset = -currentAngle;
              currentAngle += dash;
              return (
                <circle 
                  key={i}
                  r="16" cx="16" cy="16" 
                  fill="transparent" 
                  stroke={item.color} 
                  strokeWidth="8" 
                  strokeDasharray={dasharray}
                  strokeDashoffset={offset}
                  style={{ transition: 'all 1s ease' }}
                />
              );
            })}
          </svg>
          {/* Inner circle for doughnut effect */}
          <div style={{ position: 'absolute', top: '25%', left: '25%', width: '50%', height: '50%', background: 'var(--bg-main)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>142</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Deals</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }}></div>
              <div style={{ width: '90px', color: 'var(--text-muted)' }}>{item.label}</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.value}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
