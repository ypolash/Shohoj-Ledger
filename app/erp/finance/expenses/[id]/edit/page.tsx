import React from 'react';
import { ExpenseForm } from '../../components/ExpenseForm';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await getSession();
  const companyId = session?.user?.companyId;
  
  if (!companyId) return redirect('/login');

  const expense = await prisma.expense.findUnique({
    where: { id, companyId }
  });

  if (!expense) return notFound();

  const serializedExpense = {
    ...expense,
    amount: Number(expense.amount),
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Edit Expense Voucher #EXP-${expense.id.slice(0, 8).toUpperCase()}`}
        description="Update disbursement details, payment channels, or expense amounts."
      />

      <ExpenseForm initialData={serializedExpense} isEdit={true} />
    </PageContainer>
  );
}
