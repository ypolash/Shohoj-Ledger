import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createPayrollPeriod(companyId: string, name: string, startDate: Date, endDate: Date) {
  return prisma.payrollPeriod.create({
    data: {
      companyId,
      name,
      startDate,
      endDate
    }
  });
}

export async function initiatePayrollRun(companyId: string, periodId: string) {
  return prisma.payrollRun.create({
    data: {
      companyId,
      periodId,
      status: 'DRAFT'
    }
  });
}

export async function lockPayrollRun(runId: string) {
  // Move to review state, preventing further automatic calculations
  return prisma.payrollRun.update({
    where: { id: runId },
    data: { status: 'REVIEW' }
  });
}

export async function createSnapshot(runId: string, snapshotData: any) {
  return prisma.payrollSnapshot.create({
    data: {
      payrollRunId: runId,
      snapshotData: JSON.stringify(snapshotData)
    }
  });
}
