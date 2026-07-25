"use client";

import React from 'react';
import { OpportunityCard } from './OpportunityCard';

interface OpportunityKanbanProps {
  opportunities: any[];
}

export function OpportunityKanban({ opportunities }: OpportunityKanbanProps) {
  // Hardcoded stages for demonstration. In a real app, this should come from a pipeline config.
  const stages = [
    { id: 'prospecting', name: 'Prospecting', color: 'var(--gray-500)' },
    { id: 'qualification', name: 'Qualification', color: 'var(--info)' },
    { id: 'proposal', name: 'Proposal', color: 'var(--primary)' },
    { id: 'negotiation', name: 'Negotiation', color: 'var(--warning)' },
    { id: 'won', name: 'Closed Won', color: 'var(--success)' },
    { id: 'lost', name: 'Closed Lost', color: 'var(--danger)' }
  ];

  const grouped = stages.map(stage => {
    return {
      ...stage,
      items: opportunities.filter(o => (o.stage?.name || 'Prospecting').toLowerCase() === stage.name.toLowerCase() || (stage.id==='prospecting' && !o.stage))
    };
  });

  return (
    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px', minHeight: '600px', alignItems: 'flex-start' }}>
      {grouped.map(col => {
        const totalValue = col.items.reduce((acc, curr) => acc + (curr.expectedRevenue || 0), 0);
        return (
          <div key={col.id} style={{ 
            minWidth: '320px', width: '320px', background: 'var(--surface-hover)', 
            borderRadius: '12px', display: 'flex', flexDirection: 'column',
            border: '1px solid var(--border-light)'
          }}>
            {/* Column Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', borderTop: `4px solid ${col.color}`, borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{col.name}</h4>
                <span style={{ fontSize: '11px', fontWeight: 600, background: 'var(--bg-main)', padding: '2px 8px', borderRadius: '12px' }}>
                  {col.items.length}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(totalValue)}
              </div>
            </div>
            
            {/* Column Body */}
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: '100px' }}>
              {col.items.map(item => (
                <OpportunityCard key={item.id} opportunity={item} />
              ))}
              {col.items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '12px', color: 'var(--text-muted)', border: '1px dashed var(--border-main)', borderRadius: '8px' }}>
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
