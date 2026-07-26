"use client";

import React from 'react';
import Link from 'next/link';

export function SalesOrderEmptyState() {
  return (
    <div style={{ 
      padding: '64px 24px', 
      textAlign: 'center', 
      background: 'var(--surface-main)', 
      borderRadius: '12px', 
      border: '1px dashed var(--border-main)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{ 
        width: '64px', height: '64px', borderRadius: '50%', 
        background: 'var(--primary-glow)', color: 'var(--primary)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center' 
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>shopping_cart</span>
      </div>
      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>No sales orders found</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px' }}>
          Create a new sales order manually or convert an existing accepted quotation.
        </p>
      </div>
      <Link href="/erp/crm/sales-orders/new">
        <button style={{ 
          padding: '10px 20px', background: 'var(--primary)', color: 'white', 
          border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' 
        }}>
          Create Sales Order
        </button>
      </Link>
    </div>
  );
}
