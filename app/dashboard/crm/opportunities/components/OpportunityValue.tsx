"use client";

import React from 'react';

interface OpportunityValueProps {
  amount: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function OpportunityValue({ amount, currency = 'BDT', size = 'md' }: OpportunityValueProps) {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
  
  let fontSize = '14px';
  if (size === 'sm') fontSize = '12px';
  if (size === 'lg') fontSize = '18px';

  return (
    <span style={{ 
      fontWeight: 600, 
      color: 'var(--text-main)', 
      fontSize 
    }}>
      {formatter.format(amount)}
    </span>
  );
}
