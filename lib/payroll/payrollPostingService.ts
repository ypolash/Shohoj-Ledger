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
  
  for (const item of run.items) {
    totalNet += Number(item.netSalary);
    // ... calculate tax totals or other deductions
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

  // 3. Mark as Posted
  return prisma.payrollRun.update({
    where: { id: runId },
    data: { status: 'POSTED' }
  });
}
