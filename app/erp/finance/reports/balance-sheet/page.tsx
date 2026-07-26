import React from 'react';
import { ExportToolbar } from '../components/ExportToolbar';
import { ReportFilters } from '../components/ReportFilters';
import { BalanceSheetTree } from './BalanceSheetTree';

export default function BalanceSheetPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <ExportToolbar title="Balance Sheet" />
      <ReportFilters />
      <BalanceSheetTree />
    </div>
  );
}
