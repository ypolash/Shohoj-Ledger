import React from 'react';
import { AccountTree } from '../components/AccountTree';
import { AccountBreadcrumb } from '../components/AccountBreadcrumb';

export default function AccountTreePage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <AccountBreadcrumb currentName="Tree View" />
      <AccountTree />
    </div>
  );
}
