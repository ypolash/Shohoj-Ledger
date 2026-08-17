"use client";

import React from 'react';
import Link from 'next/link';

export function ExpenseTable({ expenses = [], onRefresh }: { expenses?: any[], onRefresh?: () => void }) {
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh?.();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to delete expense');
      }
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  return (
    <div className="glass-card" style={{ borderRadius: '12px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Reference</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Category</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Payment Method</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Amount (BDT)</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Approval Status</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {expenses.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No expense records found.</td>
            </tr>
          ) : (
            expenses.map((exp, i) => (
              <tr key={exp.id} style={{ borderBottom: i !== expenses.length - 1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.2s' }}>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(exp.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{exp.id.substring(0, 8).toUpperCase()}</td>
                <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: 500 }}>{exp.category || 'N/A'}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{exp.paymentMethod || 'N/A'}</td>
                <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>
                  {new Intl.NumberFormat('en-US').format(exp.amount || 0)}
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                    background: exp.approvalStatus === 'APPROVED' ? 'var(--success-glow)' : exp.approvalStatus === 'PENDING' ? 'var(--warning-glow)' : 'var(--danger-glow)',
                    color: exp.approvalStatus === 'APPROVED' ? 'var(--success)' : exp.approvalStatus === 'PENDING' ? 'var(--warning)' : 'var(--danger)'
                  }}>
                    {exp.approvalStatus || 'PENDING'}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Link href={'/erp/finance/expenses/' + exp.id} style={{ 
                      padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, 
                      background: 'var(--surface-main)', color: 'var(--text-main)', border: '1px solid var(--border-main)', 
                      textDecoration: 'none', display: 'inline-block' 
                    }}>
                      View
                    </Link>
                    <Link href={'/erp/finance/expenses/' + exp.id + '/edit'} style={{ 
                      padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, 
                      background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid var(--primary)', 
                      textDecoration: 'none', display: 'inline-block' 
                    }}>
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(exp.id)} style={{ 
                      padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, 
                      background: 'var(--danger-glow)', color: 'var(--danger)', border: '1px solid var(--danger)', 
                      cursor: 'pointer' 
                    }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
