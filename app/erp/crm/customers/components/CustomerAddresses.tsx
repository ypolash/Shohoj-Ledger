"use client";

import React from 'react';

interface CustomerAddressesProps {
  customer: any;
}

export function CustomerAddresses({ customer }: CustomerAddressesProps) {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Addresses</h4>
        <button style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
          + Add Address
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Billing Address */}
        <div style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--surface-main)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>receipt_long</span>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Billing Address</span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.5 }}>
            {customer.billingAddress || customer.address || 'No billing address provided.'}
          </p>
          <button style={{ marginTop: '12px', fontSize: '12px', color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>Edit Address</button>
        </div>

        {/* Shipping Address */}
        <div style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--surface-main)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--info)' }}>local_shipping</span>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Shipping Address</span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.5 }}>
            {customer.shippingAddress || customer.address || 'No shipping address provided.'}
          </p>
          <button style={{ marginTop: '12px', fontSize: '12px', color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>Edit Address</button>
        </div>
      </div>
    </div>
  );
}
