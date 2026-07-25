"use client";

import React from 'react';

export function BudgetSummary() {
  const budgets = [
    { name: 'Marketing', spent: 1.2, limit: 2.0, color: 'var(--info)' },
    { name: 'R&D', spent: 3.5, limit: 4.0, color: 'var(--warning)' },
    { name: 'Operations', spent: 4.8, limit: 4.5, color: 'var(--danger)' },
    { name: 'Travel', spent: 0.5, limit: 1.5, color: 'var(--success)' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Budget Utilization</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {budgets.map(b => {
          const pct = Math.min((b.spent / b.limit) * 100, 100);
          const over = b.spent > b.limit;
          
          return (
            <div key={b.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{b.name}</span>
                <span style={{ color: over ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {b.spent}M / {b.limit}M {over && '(Over)'}
                </span>
              </div>
              <div style={{ height: '8px', width: '100%', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${pct}%`, 
                  background: over ? 'var(--danger)' : b.color, 
                  borderRadius: '4px' 
                }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
