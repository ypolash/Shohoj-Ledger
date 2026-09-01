import React from 'react';
import { ExpenseForm } from '../components/ExpenseForm';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default function CreateExpensePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Record Expense & Outlay"
        description="Log vendor payments, office bills, and operational expenses directly to the general ledger."
      />

      <ExpenseForm />
    </PageContainer>
  );
}
