import React from 'react';
import { ExportToolbar } from '../components/ExportToolbar';
import { ReportFilters } from '../components/ReportFilters';
import { AccountStatementTable } from './AccountStatementTable';

export default function AccountStatementPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <ExportToolbar title="Account Statement" />
      <ReportFilters />
      <AccountStatementTable />
    </div>
  );
}
