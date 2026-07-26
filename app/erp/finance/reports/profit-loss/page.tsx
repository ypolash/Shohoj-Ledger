import React from 'react';
import { ExportToolbar } from '../components/ExportToolbar';
import { ReportFilters } from '../components/ReportFilters';
import { ProfitLossTable } from './ProfitLossTable';

export default function ProfitLossPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <ExportToolbar title="Profit & Loss" />
      <ReportFilters />
      <ProfitLossTable />
    </div>
  );
}
