"use client";

import React from 'react';

type LeadStatusProps = {
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost' | string;
};

export function LeadStatus({ status }: LeadStatusProps) {
  let color = 'var(--gray-500)';
  let bg = 'var(--gray-100)';

  switch (status) {
    case 'New':
      color = 'var(--info)';
      bg = 'var(--info-glow)';
      break;
    case 'Contacted':
      color = 'var(--primary)';
      bg = 'var(--primary-glow)';
      break;
    case 'Qualified':
      color = 'var(--accent)';
      bg = 'var(--accent-glow)';
      break;
    case 'Proposal':
      color = 'var(--warning)';
      bg = 'var(--warning-glow)';
      break;
    case 'Negotiation':
      color = 'var(--warning-hover)';
      bg = 'var(--warning-glow)';
      break;
    case 'Won':
      color = 'var(--success)';
      bg = 'var(--success-glow)';
      break;
    case 'Lost':
      color = 'var(--danger)';
      bg = 'var(--danger-glow)';
      break;
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 600,
      color: color,
      background: bg,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap'
    }}>
      {status}
    </span>
  );
}
