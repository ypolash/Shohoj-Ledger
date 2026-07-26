"use client";

import React from 'react';

interface CustomerStatisticsProps {
  total: number;
  active: number;
  outstanding: number;
  salesTotal: number;
}

export function CustomerStatistics({ total, active, outstanding, salesTotal }: CustomerStatisticsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <div className="glass-card topo-bg" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Customers</span>
        <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{total}</span>
      </div>
      
      <div className="glass-card topo-bg" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Active Customers</span>
        <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success)' }}>{active}</span>
      </div>

      <div className="glass-card topo-bg" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Outstanding Receivables</span>
        <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--warning)' }}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(outstanding)}
        </span>
      </div>

      <div className="glass-card topo-bg" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Sales (YTD)</span>
        <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)' }}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(salesTotal)}
        </span>
      </div>
    </div>
  );
}
