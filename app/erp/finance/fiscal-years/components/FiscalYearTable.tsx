"use client";

import React, { useState } from 'react';

export function FiscalYearTable() {
  const [expanded, setExpanded] = useState<string>('FY-2026');

  const fiscalYears = [
    {
      id: 'FY-2026', name: 'FY 2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'Open',
      periods: [
        { name: 'July 2026', start: '2026-07-01', end: '2026-07-31', status: 'Open' },
        { name: 'June 2026', start: '2026-06-01', end: '2026-06-30', status: 'Closed' },
        { name: 'May 2026', start: '2026-05-01', end: '2026-05-31', status: 'Locked' },
      ]
    },
    {
      id: 'FY-2025', name: 'FY 2025', startDate: '2025-01-01', endDate: '2025-12-31', status: 'Closed',
      periods: []
    }
  ];

  return (
    <div className="glass-card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
      {fiscalYears.map((fy, i) => (
        <div key={fy.id} style={{ borderBottom: i !== fiscalYears.length - 1 ? '1px solid var(--border-main)' : 'none' }}>
          
          {/* FY Header */}
          <div 
            onClick={() => setExpanded(expanded === fy.id ? '' : fy.id)}
            style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              padding: '20px 24px', cursor: 'pointer', background: expanded === fy.id ? 'var(--surface-hover)' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '20px' }}>
                {expanded === fy.id ? 'expand_more' : 'chevron_right'}
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{fy.name}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {fy.startDate} to {fy.endDate}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span style={{ 
                padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                background: fy.status === 'Open' ? 'var(--success-glow)' : 'var(--surface-hover)',
                color: fy.status === 'Open' ? 'var(--success)' : 'var(--text-muted)'
              }}>
                {fy.status}
              </span>
            </div>
          </div>

          {/* Periods Table */}
          {expanded === fy.id && fy.periods.length > 0 && (
            <div style={{ padding: '0 24px 24px 60px', background: 'var(--surface-main)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '12px', fontWeight: 600 }}>Period</th>
                    <th style={{ padding: '12px', fontWeight: 600 }}>Start Date</th>
                    <th style={{ padding: '12px', fontWeight: 600 }}>End Date</th>
                    <th style={{ padding: '12px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '13px' }}>
                  {fy.periods.map((p, j) => (
                    <tr key={j} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.start}</td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.end}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
                          background: p.status === 'Open' ? 'var(--success-glow)' : p.status === 'Closed' ? 'var(--warning-glow)' : 'var(--danger-glow)',
                          color: p.status === 'Open' ? 'var(--success)' : p.status === 'Closed' ? 'var(--warning)' : 'var(--danger)'
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {p.status === 'Open' ? (
                          <button style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'var(--warning-glow)', color: 'var(--warning)', border: 'none', cursor: 'pointer' }}>Close</button>
                        ) : p.status === 'Closed' ? (
                          <button style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'var(--danger-glow)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}>Lock</button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
