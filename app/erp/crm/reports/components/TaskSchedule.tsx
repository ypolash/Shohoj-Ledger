"use client";

import React from 'react';

export function TaskSchedule() {
  const tasks = [
    { id: 1, title: 'Draft proposal for Globex', due: 'Today, 5:00 PM', priority: 'High', status: 'Pending' },
    { id: 2, title: 'Follow up with Initech on contract', due: 'Tomorrow, 10:00 AM', priority: 'Medium', status: 'Pending' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>My Tasks</h3>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>View All</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tasks.map(task => (
          <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--surface-hover)' }}>
            <input type="checkbox" style={{ marginTop: '4px', cursor: 'pointer' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>{task.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>{task.due}</span>
                <span style={{ color: task.priority === 'High' ? 'var(--danger)' : 'var(--warning)' }}>{task.priority} Priority</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
