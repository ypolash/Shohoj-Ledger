"use client";

import React from 'react';

interface CustomerProfileProps {
  customer: any;
}

export function CustomerProfile({ customer }: CustomerProfileProps) {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
      <div>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>General Information</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div><strong>Customer Code:</strong> {customer.customerCode || '-'}</div>
          <div><strong>Company Name:</strong> {customer.customerName}</div>
          <div><strong>Customer Group:</strong> {customer.group?.name || '-'}</div>
          <div><strong>Currency:</strong> {customer.currency || 'BDT'}</div>
          <div><strong>Payment Terms:</strong> {customer.paymentTerms || '-'}</div>
          <div><strong>Credit Limit:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(customer.creditLimit || 0))}</div>
        </div>
      </div>
      <div>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registration Details</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div><strong>BIN/VAT No:</strong> {customer.binNo || '-'}</div>
          <div><strong>TIN No:</strong> {customer.tinNo || '-'}</div>
          <div><strong>Registration No:</strong> {customer.registrationNo || '-'}</div>
          <div><strong>Created At:</strong> {new Date(customer.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
}
