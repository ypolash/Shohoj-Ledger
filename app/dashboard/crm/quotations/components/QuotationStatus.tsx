"use client";

import React from 'react';

interface QuotationStatusProps {
  status: string;
}

export function QuotationStatus({ status }: QuotationStatusProps) {
  let color = 'var(--gray-500)';
  let bg = 'var(--gray-100)';
  let icon = 'draft';

  switch (status?.toLowerCase()) {
    case 'draft':
      color = 'var(--gray-600)';
      bg = 'var(--gray-100)';
      icon = 'draft';
      break;
    case 'sent':
      color = 'var(--info)';
      bg = 'var(--info-glow)';
      icon = 'send';
      break;
    case 'viewed':
      color = 'var(--primary)';
      bg = 'var(--primary-glow)';
      icon = 'visibility';
      break;
    case 'accepted':
      color = 'var(--success)';
      bg = 'var(--success-glow)';
      icon = 'check_circle';
      break;
    case 'rejected':
      color = 'var(--danger)';
      bg = 'var(--danger-glow)';
      icon = 'cancel';
      break;
    case 'expired':
      color = 'var(--warning)';
      bg = 'var(--warning-glow)';
      icon = 'timer_off';
      break;
    default:
      color = 'var(--text-main)';
      bg = 'var(--surface-hover)';
      icon = 'pending';
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 600,
      background: bg,
      color: color,
      textTransform: 'uppercase'
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{icon}</span>
      {status || 'Draft'}
    </span>
  );
}
