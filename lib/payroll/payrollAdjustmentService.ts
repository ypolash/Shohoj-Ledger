import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function applyAdjustment(payrollItemId: string, type: string, amount: number, reason: string) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.payrollItem.findUniqueOrThrow({
      where: { id: payrollItemId },
      include: { payrollRun: true }
    });

    if (item.payrollRun.status !== 'REVIEW') {
      throw new Error('Adjustments can only be made while the run is in REVIEW status.');
    }

    const adj = await tx.payrollAdjustment.create({
      data: {
        payrollItemId,
        type,
        amount,
        reason
      }
    });

    // Dynamically update the Item's totals
    if (type === 'EARNING') {
      await tx.payrollItem.update({
        where: { id: payrollItemId },
        data: {
          totalAllowances: { increment: amount },
          grossSalary: { increment: amount },
          netSalary: { increment: amount }
        }
      });
    } else {
      await tx.payrollItem.update({
        where: { id: payrollItemId },
        data: {
          totalDeductions: { increment: amount },
          netSalary: { decrement: amount }
        }
      });
    }

    return adj;
  });
}
