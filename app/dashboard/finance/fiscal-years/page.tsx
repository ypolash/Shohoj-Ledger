import React from 'react';
import { PeriodToolbar } from './components/PeriodToolbar';
import { FiscalYearTable } from './components/FiscalYearTable';

export default function FiscalYearsPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <PeriodToolbar />
      <FiscalYearTable />
    </div>
  );
}
