import React from 'react';
import { AccountToolbar } from './components/AccountToolbar';
import { AccountFilters } from './components/AccountFilters';
import { AccountTable } from './components/AccountTable';

export default function AccountsPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <AccountToolbar />
      <AccountFilters />
      <AccountTable />
    </div>
  );
}
