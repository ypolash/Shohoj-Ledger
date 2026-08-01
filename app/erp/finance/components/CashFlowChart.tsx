"use client";

import React from 'react';

export function CashFlowChart({ data }: { data?: any }) {
  const categories = data?.charts?.cashflowCategories || ['Op. Balance', 'Inflow', 'Outflow', 'Closing'];
  const values = data?.charts?.cashflowValues || [0, 0, 0, 0];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Cash Flow (Waterfall)</h3>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', paddingBottom: '24px', position: 'relative' }}>
        {categories.map((c, i) => {
          let heightPct = 0;
          let bottomPct = 0;
          let color = 'var(--primary)';

          if (i === 0) {
            heightPct = (values[0] / 20) * 100 || 0;
            color = 'var(--info)';
          } else if (i === 1) {
            bottomPct = (values[0] / 20) * 100 || 0;
            heightPct = (values[1] / 20) * 100 || 0;
            color = 'var(--success)';
          } else if (i === 2) {
            bottomPct = (values[3] / 20) * 100 || 0;
            heightPct = (Math.abs(values[2]) / 20) * 100 || 0;
            color = 'var(--danger)';
          } else if (i === 3) {
            heightPct = (values[3] / 20) * 100 || 0;
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
