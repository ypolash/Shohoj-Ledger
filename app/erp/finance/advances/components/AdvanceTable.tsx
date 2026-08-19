"use client";

import React, { useState, useEffect } from 'react';

interface Advance {
  id: string;
  memberId: string;
  memberName?: string;
  memberRole?: string;
  amount: number;
  remainingAmount: number;
  reason?: string;
  status: string;
  createdAt: string;
}

export function AdvanceTable({ advances, isLoading, onEdit, onDelete }: { advances: Advance[], isLoading: boolean, onEdit?: (a: Advance) => void, onDelete?: (id: string) => void }) {
  if (isLoading) {
    return (
      <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', opacity: 0.6 }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Active Advances</h2>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Active Advances</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '16px', fontWeight: 600 }}>Beneficiary</th>
              <th style={{ padding: '16px', fontWeight: 600 }}>Reason</th>
              <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Issued Amount</th>
              <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
              <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '13px' }}>
            {advances.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No active advances found.
                </td>
              </tr>
            ) : (
              advances.map(advance => (
                <tr key={advance.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    {new Date(advance.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>
                    {advance.memberName} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '8px' }}>({advance.memberRole})</span>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-main)' }}>
                    {advance.reason || '-'}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600, textAlign: 'right', color: 'var(--text-muted)' }}>
                    {Number(advance.amount).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      backgroundColor: advance.status === 'ACTIVE' ? 'var(--warning-subtle)' : 'var(--success-subtle)',
                      color: advance.status === 'ACTIVE' ? 'var(--warning)' : 'var(--success)'
                    }}>
                      {advance.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {onEdit && (
                      <button onClick={() => onEdit(advance)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginRight: '12px' }} title="Edit">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(advance.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Delete">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
