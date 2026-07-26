"use client";

import React from 'react';

type LeadPriorityProps = {
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
};

export function LeadPriority({ priority }: LeadPriorityProps) {
  let color = 'var(--gray-500)';
  let icon = 'horizontal_rule';

  switch (priority) {
    case 'Low':
      color = 'var(--info)';
      icon = 'keyboard_arrow_down';
      break;
    case 'Medium':
      color = 'var(--success)';
      icon = 'drag_handle';
      break;
    case 'High':
      color = 'var(--warning)';
      icon = 'keyboard_arrow_up';
      break;
    case 'Urgent':
      color = 'var(--danger)';
      icon = 'keyboard_double_arrow_up';
      break;
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '13px',
      fontWeight: 500,
      color: 'var(--text-main)'
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: color }}>
        {icon}
      </span>
      {priority}
    </span>
  );
}
