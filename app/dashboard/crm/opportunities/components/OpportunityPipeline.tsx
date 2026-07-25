"use client";

import React from 'react';

interface OpportunityPipelineProps {
  opportunities: any[];
}

export function OpportunityPipeline({ opportunities }: OpportunityPipelineProps) {
  const stages = [
    { name: 'Prospecting', probability: 10 },
    { name: 'Qualification', probability: 30 },
    { name: 'Proposal', probability: 50 },
    { name: 'Negotiation', probability: 80 },
    { name: 'Closed Won', probability: 100 }
  ];

  const totalValue = opportunities.reduce((acc, curr) => acc + (curr.expectedRevenue || 0), 0);
  const maxWidth = 800; // max px width of funnel

  return (
    <div className="glass-card" style={{ padding: '32px', borderRadius: '12px' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Sales Funnel Analysis</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        {stages.map((stage, index) => {
          const itemsInStage = opportunities.filter(o => (o.stage?.name || 'Prospecting').toLowerCase() === stage.name.toLowerCase() || (stage.name==='Prospecting' && !o.stage));
          const stageValue = itemsInStage.reduce((acc, curr) => acc + (curr.expectedRevenue || 0), 0);
          
          // Funnel width narrows as it goes down
          const widthPercent = 100 - (index * 15);
          
          return (
            <div key={stage.name} style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '900px' }}>
              <div style={{ width: '150px', textAlign: 'right', paddingRight: '24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                {stage.name}
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ 
                  width: \`\${widthPercent}%\`, 
                  background: \`var(--primary-\${900 - (index * 100)})\`,
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '13px',
                  borderRadius: '4px',
                  transition: 'all var(--transition-fast)'
                }}>
                  {itemsInStage.length} Deals
                </div>
              </div>
              <div style={{ width: '200px', paddingLeft: '24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(stageValue)}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '48px', borderTop: '1px solid var(--border-light)', paddingTop: '24px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Pipeline Value</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(totalValue)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weighted Value</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(totalValue * 0.45)} {/* Mock avg probability */}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Deal Size</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(opportunities.length ? totalValue / opportunities.length : 0)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Win Rate (YTD)</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success)' }}>32%</div>
        </div>
      </div>
    </div>
  );
}
