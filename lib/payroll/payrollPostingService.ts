import { PrismaClient } from '@prisma/client';
// import { createJournalEntry } from '../accounting/postingEngineService'; // Legacy Posting Engine

const prisma = new PrismaClient();

export async function postPayroll(runId: string) {
  const run = await prisma.payrollRun.findUniqueOrThrow({
    where: { id: runId },
    include: { items: true, period: true }
  });

  if (run.status !== 'APPROVED') {
    throw new Error('Only APPROVED payroll runs can be posted to accounting.');
  }

  // 1. Gather totals for the posting engine
  let totalNet = 0;
  let totalTax = 0;
  let totalFines = 0;
  
  for (const item of run.items) {
    totalNet += Number(item.netSalary);
    // ... calculate tax totals or other deductions
  }

  const fines = await prisma.employeeFine.findMany({
    where: { payrollRunId: runId, status: 'DEDUCTED' }
  });
  for (const f of fines) {
    totalFines += Number(f.amount);
  }

  // 2. Transmit to legacy Posting Engine
  const postingPayload = {
    companyId: run.companyId,
    amount: totalNet,
    reference: `PAYROLL-${run.period.name}`,
    description: `Salary payout for ${run.period.name}`,
    type: 'EXPENSE',
    category: 'SALARY'
  };

  // await createJournalEntry(postingPayload);

  if (totalFines > 0) {
    const finesPayload = {
      companyId: run.companyId,
      amount: totalFines,
      reference: `FINES-${run.period.name}`,
      description: `Fines collected during ${run.period.name}`,
      type: 'INCOME',
      category: 'PENALTY_INCOME'
    };
    // await createJournalEntry(finesPayload);
  }

  // 3. Mark as Posted
  return prisma.payrollRun.update({
    where: { id: runId },
    data: { status: 'POSTED' }
  });
}
