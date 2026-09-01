import React from 'react';
import { IncomeForm } from '../../components/IncomeForm';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function EditIncomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await getSession();
  const companyId = session?.user?.companyId;
  
  if (!companyId) return redirect('/login');

  const income = await prisma.income.findUnique({
    where: { id, companyId }
  });

  if (!income) return notFound();

  const serializedIncome = {
    ...income,
    amount: Number(income.amount),
    received: Number(income.received),
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Edit Income Voucher #INC-${income.id.slice(0, 8).toUpperCase()}`}
        description="Update revenue details, payer information, or payment received amounts."
      />

      <IncomeForm initialData={serializedIncome} isEdit={true} />
    </PageContainer>
  );
}
