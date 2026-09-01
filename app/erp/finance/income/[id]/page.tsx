import React from 'react';
import { IncomeSummary } from '../components/IncomeSummary';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default async function IncomeDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
        title={`Income Voucher #INC-${income.id.slice(0, 8).toUpperCase()}`}
        description="Detailed revenue voucher breakdown, payer information, and collection status."
      />

      <IncomeSummary income={serializedIncome} />
    </PageContainer>
  );
}
