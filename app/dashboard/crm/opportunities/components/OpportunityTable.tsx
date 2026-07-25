"use client";

import React from 'react';
import Link from 'next/link';
import { OpportunityProbability } from './OpportunityProbability';
import { OpportunityValue } from './OpportunityValue';
import { OpportunityOwner } from './OpportunityOwner';

interface OpportunityTableProps {
  opportunities: any[];
  onDelete?: (id: string) => void;
}

export function OpportunityTable({ opportunities, onDelete }: OpportunityTableProps) {
  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Opportunity Name</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Customer</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Expected Revenue</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Stage</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Probability</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Close Date</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Owner</th>
            <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {opportunities.map((opp) => (
            <tr key={opp.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }} className="hover-row">
              <td style={{ padding: '16px 24px' }}>
                <Link href={`/dashboard/crm/opportunities/${opp.id}`} style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                  {opp.name}
                </Link>
              </td>
              <td style={{ padding: '16px 24px', color: 'var(--text-main)', fontWeight: 500 }}>
                {opp.customer?.customerName || '-'}
              </td>
              <td style={{ padding: '16px 24px' }}>
                <OpportunityValue amount={opp.expectedRevenue} currency={opp.currency} />
              </td>
              <td style={{ padding: '16px 24px' }}>
                <span style={{
                  padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
                  background: 'var(--primary-glow)', color: 'var(--primary)',
                }}>
                  {opp.stage?.name || 'New'}
                </span>
              </td>
              <td style={{ padding: '16px 24px', minWidth: '120px' }}>
                <OpportunityProbability probability={opp.probability || 0} />
              </td>
              <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                {new Date(opp.expectedCloseDate).toLocaleDateString()}
              </td>
              <td style={{ padding: '16px 24px' }}>
                <OpportunityOwner ownerName={opp.owner?.name || opp.ownerId} />
              </td>
              <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Link href={`/dashboard/crm/opportunities/${opp.id}/edit`}>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                    </button>
                  </Link>
                  <button onClick={() => onDelete && onDelete(opp.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-row:hover { background: var(--surface-hover); }
      `}} />
    </div>
  );
}
