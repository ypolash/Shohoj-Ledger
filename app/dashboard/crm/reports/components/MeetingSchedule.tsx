"use client";

import React from 'react';

export function MeetingSchedule() {
  const meetings = [
    { id: 1, title: 'Discovery: Acme Corp', time: '10:00 AM - 11:00 AM', attendees: 3, link: '#' },
    { id: 2, title: 'Contract Review: Soylent', time: '2:30 PM - 3:15 PM', attendees: 2, link: '#' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Upcoming Meetings</h3>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Add New</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {meetings.map(mtg => (
          <div key={mtg.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
            <div style={{ width: '4px', background: 'var(--primary)', borderRadius: '4px' }}></div>
            <div style={{ flex: 1, padding: '12px', background: 'var(--surface-main)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>{mtg.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                {mtg.time}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{mtg.attendees} Attendees</div>
                <button style={{ padding: '4px 12px', background: 'var(--primary-glow)', color: 'var(--primary)', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Join Video</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
