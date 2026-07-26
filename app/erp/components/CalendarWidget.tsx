"use client";

import React from 'react';

export function CalendarWidget() {
  const events = [
    { date: '12', day: 'Mon', title: 'Board Meeting', type: 'MEETING' },
    { date: '14', day: 'Wed', title: 'Payroll Processing', type: 'PAYROLL' },
    { date: '15', day: 'Thu', title: 'Project UI-2 Deadline', type: 'PROJECT' },
    { date: '18', day: 'Sun', title: 'Public Holiday', type: 'LEAVE' },
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', flex: 1, minWidth: '300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, fontFamily: 'serif' }}>Calendar</h3>
        <span style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>Open</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {events.map((e, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--surface-hover)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              width: '48px',
              height: '48px'
            }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{e.day}</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>{e.date}</span>
            </div>
            
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>{e.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{e.type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
