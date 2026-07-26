"use client";

import React from 'react';

interface CustomerContactsProps {
  customer: any;
}

export function CustomerContacts({ customer }: CustomerContactsProps) {
  // In a real scenario, this would be an array of contact objects.
  // We'll display the primary contact for now and a button to add more.
  
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Contacts</h4>
        <button style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
          + Add Contact
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Primary Contact Card */}
        <div style={{ padding: '16px', border: '1px solid var(--primary)', borderRadius: '8px', background: 'var(--primary-glow)', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '10px', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>PRIMARY</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {customer.primaryContactPerson ? customer.primaryContactPerson.charAt(0) : 'C'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>{customer.primaryContactPerson || 'Unknown Contact'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Main Point of Contact</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>call</span>
              {customer.phone || '-'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>mail</span>
              {customer.email || '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
