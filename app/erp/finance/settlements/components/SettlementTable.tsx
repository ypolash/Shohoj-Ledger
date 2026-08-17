"use client";

import React from 'react';

export function SettlementTable({ settlements = [], onExecute }: { settlements?: any[], onExecute?: (id: string) => void }) {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Period</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Total Income</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Total Expenses</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Net Profit</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>CEO Share</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Dev Share</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Company Share</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {settlements.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No settlements found.</td>
            </tr>
          ) : (
            settlements.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i !== settlements.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{s.period}</td>
                <td style={{ padding: '16px', color: 'var(--success)' }}>{new Intl.NumberFormat('en-US').format(s.totalIncome || 0)}</td>
                <td style={{ padding: '16px', color: 'var(--danger)' }}>{new Intl.NumberFormat('en-US').format(s.totalExpenses || 0)}</td>
                <td style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{new Intl.NumberFormat('en-US').format(s.netProfit || 0)}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Intl.NumberFormat('en-US').format(s.ceoShare || 0)}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Intl.NumberFormat('en-US').format(s.developerShare || 0)}</td>
                <td style={{ padding: '16px', color: 'var(--info)' }}>{new Intl.NumberFormat('en-US').format(s.companyShare || 0)}</td>
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
