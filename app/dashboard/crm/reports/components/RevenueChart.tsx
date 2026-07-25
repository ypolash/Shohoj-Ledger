"use client";

import React from 'react';

export function RevenueChart() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const values = [2.1, 2.8, 3.5, 3.2, 4.8, 5.2, 6.1]; // In Millions
  
  const maxVal = Math.max(...values);
  const height = 200;
  
  // Create SVG points
  const points = values.map((val, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((val / (maxVal * 1.2)) * 100);
    return \`\${x},\${y}\`;
  }).join(' ');

  const areaPoints = \`0,100 \${points} 100,100\`;

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Revenue Trend (YTD)</h3>
        <select style={{ background: 'var(--surface-hover)', border: 'none', color: 'var(--text-main)', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}>
          <option>2026</option>
          <option>2025</option>
        </select>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: '200px' }}>
        {/* Y Axis Labels */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>8M</span>
          <span>6M</span>
          <span>4M</span>
          <span>2M</span>
          <span>0</span>
        </div>

        {/* Chart Area */}
        <div style={{ marginLeft: '45px', height: '100%', position: 'relative' }}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(pct => (
            <div key={pct} style={{ position: 'absolute', left: 0, right: 0, top: \`\${pct}%\`, borderTop: '1px dashed var(--border-light)' }} />
          ))}

          {/* SVG Line & Area */}
          <svg style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline points={areaPoints} fill="url(#revenueGradient)" />
            <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Data Points */}
            {values.map((val, i) => {
              const x = (i / (values.length - 1)) * 100;
              const y = 100 - ((val / (maxVal * 1.2)) * 100);
              return (
                <circle key={i} cx={x} cy={y} r="3" fill="var(--bg-main)" stroke="var(--primary)" strokeWidth="2" />
              );
            })}
          </svg>

          {/* X Axis Labels */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: '-24px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            {months.map(m => <span key={m}>{m}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
