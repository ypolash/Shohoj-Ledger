"use client";

import React from 'react';

interface OpportunityProbabilityProps {
  probability: number; // 0 to 100
}

export function OpportunityProbability({ probability }: OpportunityProbabilityProps) {
  let color = 'var(--danger)';
  if (probability >= 40) color = 'var(--warning)';
  if (probability >= 70) color = 'var(--info)';
  if (probability >= 90) color = 'var(--success)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div style={{ flex: 1, height: '6px', background: 'var(--border-main)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${probability}%`, height: '100%', background: color, borderRadius: '4px' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color, width: '32px', textAlign: 'right' }}>
        {probability}%
      </span>
    </div>
  );
}
