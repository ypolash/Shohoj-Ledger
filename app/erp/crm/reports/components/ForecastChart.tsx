"use client";

import React from 'react';

export function ForecastChart() {
  const periods = ['Q1', 'Q2', 'Q3', 'Q4'];
  const actual = [2.5, 3.2, 0, 0]; // 0 means future
  const forecast = [2.6, 3.0, 4.1, 5.0];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', height: '100%' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Revenue vs Forecast</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {periods.map((p, i) => (
          <div key={p}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p} 2026</span>
              <span style={{ color: 'var(--text-muted)' }}>Target: ৳ {forecast[i]}M</span>
            </div>
            
            <div style={{ height: '12px', width: '100%', background: 'var(--surface-hover)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
              {/* Target Line marker */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(forecast[i] / 6) * 100}%`, width: '2px', background: 'var(--warning)', zIndex: 2 }}></div>
              
              {actual[i] > 0 ? (
                <div style={{ 
                  height: '100%', 
                  width: `${(actual[i] / 6) * 100}%`, 
                  background: actual[i] >= forecast[i] ? 'var(--success)' : 'var(--primary)',
                  borderRadius: '6px',
                  zIndex: 1,
                  position: 'relative'
                }}></div>
              ) : (
                <div style={{ 
                  height: '100%', 
                  width: `${((forecast[i]*0.8) / 6) * 100}%`, 
                  background: 'var(--gray-300)',
                  borderRadius: '6px',
                  border: '1px dashed var(--gray-500)',
                  zIndex: 1,
                  position: 'relative'
                }}></div>
              )}
            </div>
            {actual[i] > 0 && (
              <div style={{ fontSize: '11px', marginTop: '4px', color: actual[i] >= forecast[i] ? 'var(--success)' : 'var(--text-muted)' }}>
                Actual: ৳ {actual[i]}M
              </div>
            )}
            {actual[i] === 0 && (
              <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-muted)' }}>
                Projected (Weighted): ৳ {(forecast[i]*0.8).toFixed(1)}M
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
