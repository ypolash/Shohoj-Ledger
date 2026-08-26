"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CustomerTableProps {
  customers: any[];
  onDelete?: (id: string) => void;
}

export function CustomerTable({ customers, onDelete }: CustomerTableProps) {
  const router = useRouter();
  
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
            <th style={{ padding: '16px', fontWeight: 600 }}>Balance</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {customers.map((customer) => (
            <tr 
              key={customer.id} 
              onClick={() => router.push(`/erp/crm/customers/${customer.id}`)}
              style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '16px' }}>
                <Link href={`/erp/crm/customers/${customer.id}`} style={{ fontWeight: 600, color: 'var(--primary)', display: 'block' }}>
                  {customer.displayName || customer.name}
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
              </td>
              <td style={{ padding: '16px' }}>
                <span style={{
                  padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                  background: customer.status === 'Active' ? 'var(--success-glow)' : 'var(--gray-100)',
                  color: customer.status === 'Active' ? 'var(--success)' : 'var(--gray-500)',
                }}>
                  {customer.status || 'Active'}
                </span>
              </td>
              <td style={{ padding: '16px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); router.push(`/erp/crm/sales-orders/new?customerId=${customer.id}`); }}
                    style={{ 
                      padding: '6px 10px', 
                      color: 'var(--success)', 
                      borderRadius: '6px', 
                      background: 'var(--success-glow)', 
                      border: '1px solid var(--success-border, transparent)', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                    title="Create Sales Order for Customer"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add_shopping_cart</span>
                    Order
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); router.push(`/erp/crm/customers/${customer.id}/edit`); }}
                    style={{ padding: '6px', color: 'var(--primary)', borderRadius: '6px', background: 'var(--primary-glow)', border: 'none', cursor: 'pointer' }}
                    title="Edit Customer"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (onDelete) onDelete(customer.id); 
                    }}
                    style={{ padding: '6px', color: 'var(--danger)', borderRadius: '6px', background: 'var(--danger-glow)', border: 'none', cursor: 'pointer' }}
                    title="Delete Customer"
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
