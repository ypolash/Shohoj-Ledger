"use client";

import React from 'react';

export function ConversionChart() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const win = [30, 45, 35, 50, 60, 55];
  const loss = [20, 15, 25, 20, 10, 15];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Win / Loss Analysis</h3>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', paddingBottom: '24px' }}>
        {months.map((m, i) => (
          <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
            <div style={{ height: '150px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '2px' }}>
              <div style={{ width: '100%', height: \`\${(loss[i] / 100) * 100}%\`, background: 'var(--danger)', borderRadius: '4px 4px 0 0', opacity: 0.8 }} title={\`Lost: \${loss[i]}\`}></div>
              <div style={{ width: '100%', height: \`\${(win[i] / 100) * 100}%\`, background: 'var(--success)', borderRadius: '0 0 4px 4px', opacity: 0.9 }} title={\`Won: \${win[i]}\`}></div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m}</div>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--success)' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>Won Deals</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--danger)' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>Lost Deals</span>
        </div>
      </div>
    </div>
  );
}
