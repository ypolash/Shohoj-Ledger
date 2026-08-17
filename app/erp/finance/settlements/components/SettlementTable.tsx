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
                }}>
                  {stl.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
