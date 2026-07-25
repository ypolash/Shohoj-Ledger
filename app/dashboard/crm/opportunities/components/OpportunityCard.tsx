"use client";

import React from 'react';
import Link from 'next/link';
import { OpportunityProbability } from './OpportunityProbability';
import { OpportunityValue } from './OpportunityValue';

interface OpportunityCardProps {
  opportunity: any;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  return (
    <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'grab', background: 'var(--surface-main)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Link href={`/dashboard/crm/opportunities/${opportunity.id}`} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
          {opportunity.name}
        </Link>
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
        {opportunity.customer?.customerName || 'Unknown Customer'}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <OpportunityValue amount={opportunity.expectedRevenue} currency={opportunity.currency} size="sm" />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
        </span>
      </div>

      <OpportunityProbability probability={opportunity.probability || 0} />
    </div>
  );
}
