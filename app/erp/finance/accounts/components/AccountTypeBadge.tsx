"use client";

import React from 'react';

export function AccountTypeBadge({ type }: { type: string }) {
  let color = 'var(--text-muted)';
  let bg = 'var(--surface-hover)';

  if (type === 'Asset') { color = 'var(--primary)'; bg = 'var(--primary-glow)'; }
  else if (type === 'Liability') { color = 'var(--warning)'; bg = 'var(--warning-glow)'; }
  else if (type === 'Equity') { color = 'var(--info)'; bg = 'var(--info-glow)'; }
  else if (type === 'Revenue') { color = 'var(--success)'; bg = 'var(--success-glow)'; }
  else if (type === 'Expense') { color = 'var(--danger)'; bg = 'var(--danger-glow)'; }

  return (
    <span style={{ 
      padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
      background: bg, color: color, display: 'inline-block'
    }}>
      {type}
    </span>
  );
}
