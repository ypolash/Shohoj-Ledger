import React from 'react';
import { ExportToolbar } from '../components/ExportToolbar';
import { ReportFilters } from '../components/ReportFilters';
import { CashFlowTable } from './CashFlowTable';

export default function CashFlowPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <ExportToolbar title="Cash Flow Statement" />
      <ReportFilters />
      <CashFlowTable />
    </div>
  );
}
