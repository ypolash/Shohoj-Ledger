import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export function generateAdvanceNumber(companyId: string) {
  return `ADV-${companyId.substring(0,4)}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function createAdvance(companyId: string, employeeId: string, amount: number, recoveryMethod: string) {
  return prisma.salaryAdvance.create({
    data: {
      companyId,
      employeeId,
      advanceNumber: generateAdvanceNumber(companyId),
      amount,
      recoveryMethod,
      status: 'DRAFT'
    }
  });
}

export async function approveAdvance(advanceId: string) {
  return prisma.salaryAdvance.update({
    where: { id: advanceId },
    data: { status: 'APPROVED' }
  });
}

export async function issueAdvance(advanceId: string) {
  return prisma.$transaction(async (tx) => {
    const advance = await tx.salaryAdvance.update({
      where: { id: advanceId },
      data: { status: 'ACTIVE' }
    });

    // Transmit to Posting Engine
    // await createJournalEntry({ type: 'ADVANCE_DISBURSEMENT', amount: advance.amount ... });

    return advance;
  });
}

export async function recoverAdvance(advanceId: string, amountToRecover: number, payrollRef?: string) {
  return prisma.$transaction(async (tx) => {
    const advance = await tx.salaryAdvance.findUniqueOrThrow({
      where: { id: advanceId },
      include: { recoveries: true }
    });

    const totalRecoveredAlready = advance.recoveries.reduce((sum: number, r: any) => sum + Number(r.amount), 0);
    const newTotal = totalRecoveredAlready + amountToRecover;

    if (newTotal > Number(advance.amount)) {
      throw new Error('Recovery amount exceeds advance limit.');
    }

    // 1. Record Recovery
    await tx.salaryAdvanceRecovery.create({
      data: {
        advanceId,
        amount: amountToRecover,
        payrollReference: payrollRef
      }
    });

    // 2. Mark completed if fully paid
    if (newTotal >= Number(advance.amount)) {
      await tx.salaryAdvance.update({
        where: { id: advanceId },
        data: { status: 'COMPLETED' }
      });
    }

    // Transmit to Posting Engine
    // await createJournalEntry({ type: 'ADVANCE_RECOVERY', amount: amountToRecover ... });

    return true;
  });
}
