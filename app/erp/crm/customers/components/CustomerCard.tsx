"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CustomerCardProps {
  customer: any;
  onDelete?: (id: string) => void;
}

export function CustomerCard({ customer, onDelete }: CustomerCardProps) {
  const router = useRouter();

  return (
    <div 
      className="glass-card" 
      onClick={() => router.push(`/erp/crm/customers/${customer.id}`)}
      style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link href={`/erp/crm/customers/${customer.id}`} style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
            {customer.customerName}
          </Link>
          <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>{customer.primaryContactPerson || '-'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{customer.email || customer.phone}</div>
        </div>
        <span style={{
          padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
          background: customer.status === 'Active' ? 'var(--success-glow)' : 'var(--gray-100)',
          color: customer.status === 'Active' ? 'var(--success)' : 'var(--gray-500)',
        }}>
          {customer.status || 'Active'}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Group</span>
          <span style={{ fontWeight: 500 }}>{customer.group?.name || '-'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Balance</span>
          <span style={{ fontWeight: 500 }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(customer.outstandingBalance || 0))}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
        <button 
          onClick={(e) => { e.stopPropagation(); router.push(`/erp/crm/customers/${customer.id}/edit`); }}
          style={{ padding: '8px 16px', color: 'var(--primary)', borderRadius: '6px', background: 'var(--primary-glow)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          Edit
        </button>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (onDelete) onDelete(customer.id); 
          }}
          style={{ padding: '8px 16px', color: 'var(--danger)', borderRadius: '6px', background: 'var(--danger-glow)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
