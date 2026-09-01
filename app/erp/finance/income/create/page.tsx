import React from 'react';
import { IncomeForm } from '../components/IncomeForm';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default function CreateIncomePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Record Income & Receivables"
        description="Create an income entry, specify payer details, and log cash inflows directly into the general ledger."
      />

      <IncomeForm />
    </PageContainer>
  );
}
