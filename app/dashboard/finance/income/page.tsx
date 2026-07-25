import React from 'react';
import { IncomeToolbar } from './components/IncomeToolbar';
import { IncomeFilters } from './components/IncomeFilters';
import { IncomeTable } from './components/IncomeTable';

export default function IncomePage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <IncomeToolbar />
      <IncomeFilters />
      <IncomeTable />
    </div>
  );
}
