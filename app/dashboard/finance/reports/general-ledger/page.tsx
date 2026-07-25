import React from 'react';
import { ExportToolbar } from '../components/ExportToolbar';
import { ReportFilters } from '../components/ReportFilters';
import { GeneralLedgerTable } from './GeneralLedgerTable';

export default function GeneralLedgerPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <ExportToolbar title="General Ledger" />
      <ReportFilters />
      <GeneralLedgerTable />
    </div>
  );
}
