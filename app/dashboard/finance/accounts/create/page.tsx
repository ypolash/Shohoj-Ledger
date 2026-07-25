import React from 'react';
import { AccountBreadcrumb } from '../components/AccountBreadcrumb';
import { AccountForm } from '../components/AccountForm';

export default function AccountCreatePage() {
  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <AccountBreadcrumb currentName="Create New Account" />
      <AccountForm />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
        <button style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save Account</button>
      </div>
    </div>
  );
}
