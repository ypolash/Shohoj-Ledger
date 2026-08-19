"use client";

import React from 'react';

export function SettlementTable({ settlements = [], activeRoles = [], onExecute }: { settlements?: any[], activeRoles?: string[], onExecute?: (id: string) => void }) {
  const hasCeoShare = activeRoles.includes('ceo') || settlements.some(s => Number(s.ceoShare) > 0);
  const hasDevShare = activeRoles.includes('dev') || settlements.some(s => Number(s.developerShare) > 0);
  const hasCompanyShare = activeRoles.includes('company') || settlements.some(s => Number(s.companyShare) > 0);
  const hasAdvisorShare = activeRoles.includes('advisor') || settlements.some(s => Number(s.advisorShare) > 0);

  const colSpan = 6 + (hasCeoShare ? 1 : 0) + (hasDevShare ? 1 : 0) + (hasCompanyShare ? 1 : 0) + (hasAdvisorShare ? 1 : 0);

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Period</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Total Income</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Total Expenses</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Net Profit</th>
            {hasCeoShare && <th style={{ padding: '16px', fontWeight: 600 }}>CEO Share</th>}
            {hasDevShare && <th style={{ padding: '16px', fontWeight: 600 }}>Dev Share</th>}
            {hasCompanyShare && <th style={{ padding: '16px', fontWeight: 600 }}>Company Share</th>}
            {hasAdvisorShare && <th style={{ padding: '16px', fontWeight: 600 }}>Advisor Share</th>}
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {settlements.length === 0 ? (
            <tr>
              <td colSpan={colSpan} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No settlements found.</td>
            </tr>
          ) : (
            settlements.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i !== settlements.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{s.period}</td>
                <td style={{ padding: '16px', color: 'var(--success)' }}>{new Intl.NumberFormat('en-US').format(s.totalIncome || 0)}</td>
                <td style={{ padding: '16px', color: 'var(--danger)' }}>{new Intl.NumberFormat('en-US').format(s.totalExpenses || 0)}</td>
                <td style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{new Intl.NumberFormat('en-US').format(s.netProfit || 0)}</td>
                {hasCeoShare && <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Intl.NumberFormat('en-US').format(s.ceoShare || 0)}</td>}
                {hasDevShare && <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Intl.NumberFormat('en-US').format(s.developerShare || 0)}</td>}
                {hasCompanyShare && <td style={{ padding: '16px', color: 'var(--info)' }}>{new Intl.NumberFormat('en-US').format(s.companyShare || 0)}</td>}
                {hasAdvisorShare && <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Intl.NumberFormat('en-US').format(s.advisorShare || 0)}</td>}
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                    background: s.status === 'EXECUTED' ? 'var(--success-glow)' : 'var(--warning-glow)',
                    color: s.status === 'EXECUTED' ? 'var(--success)' : 'var(--warning)'
                  }}>
                    {s.status}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  {s.status === 'PENDING' && onExecute && (
                    <button onClick={() => onExecute(s.id)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>
                      Execute
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
