"use client";

import React from 'react';

export function CashFlowChart() {
  const categories = ['Op. Balance', 'Inflow', 'Outflow', 'Closing'];
  const values = [5.0, 14.5, -8.2, 11.3];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Cash Flow (Waterfall)</h3>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', paddingBottom: '24px', position: 'relative' }}>
        {categories.map((c, i) => {
          let heightPct = 0;
          let bottomPct = 0;
          let color = 'var(--primary)';

          if (i === 0) {
            heightPct = (5.0 / 20) * 100;
            color = 'var(--info)';
          } else if (i === 1) {
            bottomPct = (5.0 / 20) * 100;
            heightPct = (14.5 / 20) * 100;
            color = 'var(--success)';
          } else if (i === 2) {
            bottomPct = (11.3 / 20) * 100;
            heightPct = (8.2 / 20) * 100;
            color = 'var(--danger)';
          } else if (i === 3) {
            heightPct = (11.3 / 20) * 100;
            color = 'var(--primary)';
          }

          return (
            <div key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
              <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  bottom: `${bottomPct}%`, 
                  height: `${heightPct}%`, 
                  width: '60%', 
                  left: '20%',
                  background: color, 
                  borderRadius: '4px' 
                }}></div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c}</div>
              <div style={{ fontSize: '11px', fontWeight: 600 }}>{Math.abs(values[i]).toFixed(1)}M</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
