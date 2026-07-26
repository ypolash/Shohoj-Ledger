"use client";

import React from 'react';
import Link from 'next/link';

interface CustomerTableProps {
  customers: any[];
  onDelete?: (id: string) => void;
}

export function CustomerTable({ customers, onDelete }: CustomerTableProps) {
  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ 
            background: 'var(--surface-hover)', 
            color: 'var(--text-muted)', 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            borderBottom: '1px solid var(--border-main)'
          }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>ID & Name</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Contact Info</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Group</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Balance & Health</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Last Contact</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {customers.map((customer) => (
            <tr key={customer.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '16px' }}>
                <Link href={`/dashboard/crm/customers/${customer.id}`} style={{ fontWeight: 600, color: 'var(--primary)', display: 'block' }}>
                  {customer.customerName}
                </Link>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>#{customer.customerCode || customer.id.slice(0, 8)}</div>
              </td>
              <td style={{ padding: '16px' }}>
                <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{customer.primaryContactPerson || '-'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{customer.email || customer.phone}</div>
              </td>
              <td style={{ padding: '16px', color: 'var(--text-main)' }}>
                {customer.group?.name || '-'}
              </td>
              <td style={{ padding: '16px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(customer.outstandingBalance || 0))}
                </div>
                <div style={{ marginTop: '4px' }}>
                  {Number(customer.outstandingBalance || 0) > 50000 ? (
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: 'var(--danger-glow)', color: 'var(--danger)' }}>AT RISK</span>
                  ) : Number(customer.outstandingBalance || 0) > 0 ? (
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: 'var(--warning-glow)', color: 'var(--warning)' }}>GOOD</span>
                  ) : (
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: 'var(--success-glow)', color: 'var(--success)' }}>EXCELLENT</span>
                  )}
                </div>
              </td>
              <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>history</span>
                  {Math.floor(Math.random() * 5) + 1} days ago
                </div>
              </td>
              <td style={{ padding: '16px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Link href={`/dashboard/crm/customers/${customer.id}/edit`}>
                    <button style={{ padding: '6px', color: 'var(--primary)', borderRadius: '6px', background: 'var(--primary-glow)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                    </button>
                  </Link>
                  <button 
                    onClick={() => onDelete && onDelete(customer.id)}
                    style={{ padding: '6px', color: 'var(--danger)', borderRadius: '6px', background: 'var(--danger-glow)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
