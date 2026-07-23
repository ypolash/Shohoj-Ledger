import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function approvePayrollRun(runId: string, approverId: string, comments?: string) {
  return prisma.$transaction(async (tx) => {
    const run = await tx.payrollRun.findUniqueOrThrow({
      where: { id: runId }
    });

    if (run.status !== 'REVIEW') {
      throw new Error('Only runs in REVIEW status can be approved.');
    }

    await tx.payrollApproval.create({
      data: {
        payrollRunId: runId,
        approverId,
        status: 'APPROVED',
        comments
      }
    });

    return tx.payrollRun.update({
      where: { id: runId },
      data: { status: 'APPROVED' }
    });
  });
}

export async function rejectPayrollRun(runId: string, approverId: string, comments: string) {
  return prisma.$transaction(async (tx) => {
    await tx.payrollApproval.create({
      data: {
        payrollRunId: runId,
        approverId,
        status: 'REJECTED',
        comments
      }
    });

    return tx.payrollRun.update({
      where: { id: runId },
      data: { status: 'DRAFT' } // Reopen for calculation
    });
  });
}
