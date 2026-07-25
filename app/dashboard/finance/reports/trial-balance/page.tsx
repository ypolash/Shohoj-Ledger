import React from 'react';
import { ExportToolbar } from '../components/ExportToolbar';
import { ReportFilters } from '../components/ReportFilters';
import { TrialBalanceTable } from './TrialBalanceTable';

export default function TrialBalancePage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <ExportToolbar title="Trial Balance" />
      <ReportFilters />
      <TrialBalanceTable />
    </div>
  );
}
