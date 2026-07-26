"use client";

import React from 'react';

interface OpportunityForecastProps {
  opportunities: any[];
}

export function OpportunityForecast({ opportunities }: OpportunityForecastProps) {
  // A simple mock of monthly forecast grouping
  const months = ['July 2026', 'August 2026', 'September 2026', 'October 2026'];
  
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Revenue Forecast</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Period</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Deals Closing</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Pipeline Value</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Weighted Value</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Status</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {months.map((month, idx) => {
            const deals = 5 + idx * 2;
            const value = 500000 + (idx * 150000);
            const weighted = value * (0.6 - (idx * 0.1)); // Gets less certain further out
            
            return (
              <tr key={month} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '16px 24px', fontWeight: 600 }}>{month}</td>
                <td style={{ padding: '16px 24px' }}>{deals}</td>
                <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(value)}
                </td>
                <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--primary)' }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(weighted)}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {idx === 0 ? (
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: 'var(--success-glow)', color: 'var(--success)' }}>On Track</span>
                  ) : (
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: 'var(--gray-100)', color: 'var(--gray-500)' }}>Projected</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
