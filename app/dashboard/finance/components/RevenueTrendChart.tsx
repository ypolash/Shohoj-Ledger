"use client";

import React from 'react';

export function RevenueTrendChart() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const values = [8.5, 9.2, 10.1, 9.8, 12.5, 13.0, 14.5];
  const target = [10, 10, 11, 11, 12, 13, 14];
  
  const maxVal = 16;
  
  const points = values.map((val: number, i: number) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((val / maxVal) * 100);
    return `${x},${y}`;
  }).join(' ');

  const targetPoints = target.map((val: number, i: number) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((val / maxVal) * 100);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Revenue vs Target</h3>
      
      <div style={{ flex: 1, position: 'relative', minHeight: '200px' }}>
        <div style={{ marginLeft: '10px', marginRight: '10px', height: '100%', position: 'relative' }}>
          {[0, 25, 50, 75, 100].map(pct => (
            <div key={pct} style={{ position: 'absolute', left: 0, right: 0, top: `${pct}%`, borderTop: '1px dashed var(--border-light)' }} />
          ))}

          <svg style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Target Line */}
            <polyline points={targetPoints} fill="none" stroke="var(--border-main)" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            {/* Actual Line */}
            <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
          
          {values.map((val: number, i: number) => {
            const x = (i / (values.length - 1)) * 100;
            const y = 100 - ((val / maxVal) * 100);
            return (
              <div 
                key={i} 
                style={{ 
                  position: 'absolute', 
                  left: `${x}%`, 
                  top: `${y}%`, 
                  width: '10px', 
                  height: '10px', 
                  background: 'var(--bg-main)', 
                  border: '2px solid var(--primary)', 
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10
                }} 
              />
            );
          })}

          <div style={{ position: 'absolute', left: 0, right: 0, bottom: '-24px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            {months.map((m: string) => <span key={m}>{m}</span>)}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '12px', marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '3px', background: 'var(--primary)' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>Actual Revenue</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '0', borderTop: '2px dashed var(--border-main)' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>Target</span>
        </div>
      </div>
    </div>
  );
}
