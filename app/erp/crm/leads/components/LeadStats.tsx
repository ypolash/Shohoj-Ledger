"use client";

import React from 'react';

interface LeadStatsProps {
  total: number;
  newLeads: number;
  qualified: number;
  won: number;
}

export function LeadStats({ total, newLeads, qualified, won }: LeadStatsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <div className="glass-card topo-bg" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Leads</span>
        <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{total}</span>
      </div>
      
      <div className="glass-card topo-bg" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>New Leads</span>
        <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--info)' }}>{newLeads}</span>
      </div>

      <div className="glass-card topo-bg" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Qualified</span>
        <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent)' }}>{qualified}</span>
      </div>

      <div className="glass-card topo-bg" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Won (This Month)</span>
        <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success)' }}>{won}</span>
      </div>
    </div>
  );
}
