import React from 'react';
import { AccountBreadcrumb } from '../components/AccountBreadcrumb';
import { AccountSummary } from '../components/AccountSummary';
import { AccountHistory } from '../components/AccountHistory';

export default function AccountDetailPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <AccountBreadcrumb currentName="1000-02 City Bank (Main)" />
      <AccountSummary />
      <AccountHistory />
    </div>
  );
}
