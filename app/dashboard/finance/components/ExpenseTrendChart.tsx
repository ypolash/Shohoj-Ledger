"use client";

import React from 'react';

export function ExpenseTrendChart() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const values = [7.1, 7.8, 7.5, 8.2, 8.8, 8.2, 9.1]; // In Millions
  
  const maxVal = 12;
  
  const points = values.map((val: number, i: number) => {
    const x = (i / Math.max(1, values.length - 1)) * 100;
    const y = 100 - ((val / maxVal) * 100);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Expense Trend</h3>
        <select style={{ background: 'var(--surface-hover)', border: 'none', color: 'var(--text-main)', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}>
          <option>2026</option>
          <option>2025</option>
        </select>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: '200px' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>12M</span>
          <span>9M</span>
          <span>6M</span>
          <span>3M</span>
          <span>0</span>
        </div>

        <div style={{ marginLeft: '45px', height: '100%', position: 'relative' }}>
          {[0, 25, 50, 75, 100].map(pct => (
            <div key={pct} style={{ position: 'absolute', left: 0, right: 0, top: `${pct}%`, borderTop: '1px dashed var(--border-light)' }} />
          ))}

          <svg style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="expenseGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--danger)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline points={areaPoints} fill="url(#expenseGradient)" stroke="none" />
            <polyline points={points} fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
          
          {values.map((val: number, i: number) => {
            const x = (i / Math.max(1, values.length - 1)) * 100;
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
                  border: '2px solid var(--danger)', 
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
    </div>
  );
}
