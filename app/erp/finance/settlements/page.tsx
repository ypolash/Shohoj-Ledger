import React from 'react';
import { SettlementToolbar } from './components/SettlementToolbar';
import { SettlementTable } from './components/SettlementTable';

export default function SettlementsPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <SettlementToolbar />
      <SettlementTable />
    </div>
  );
}
