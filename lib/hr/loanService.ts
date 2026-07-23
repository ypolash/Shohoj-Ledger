import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export function generateLoanNumber(companyId: string) {
  return `LOAN-${companyId.substring(0,4)}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function createLoan(companyId: string, employeeId: string, data: any) {
  return prisma.employeeLoan.create({
    data: {
      ...data,
      companyId,
      employeeId,
      loanNumber: generateLoanNumber(companyId),
      outstandingBalance: data.principalAmount, // initial state
      status: 'SUBMITTED'
    }
  });
}

export async function approveLoan(loanId: string, approverId: string) {
  return prisma.employeeLoan.update({
    where: { id: loanId },
    data: {
      status: 'APPROVED',
      approvedById: approverId
    }
  });
}

export async function issueLoan(loanId: string) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.employeeLoan.findUniqueOrThrow({
      where: { id: loanId }
    });

    if (loan.status !== 'APPROVED') {
      throw new Error('Only APPROVED loans can be issued.');
    }

    // Generate installment schedule
    const installments = [];
    let currentDate = new Date(loan.issueDate);
    
    for (let i = 1; i <= loan.installmentCount; i++) {
      currentDate.setMonth(currentDate.getMonth() + 1); // rough +1 month
      installments.push({
        loanId,
        installmentNo: i,
        dueDate: new Date(currentDate),
        amount: loan.installmentAmount
      });
    }

    await tx.employeeLoanInstallment.createMany({
      data: installments
    });

    // Mark active
    await tx.employeeLoan.update({
      where: { id: loanId },
      data: { status: 'ACTIVE' }
    });

    // Transmit to Posting Engine
    // await createJournalEntry({ type: 'LOAN_DISBURSEMENT', amount: loan.principalAmount ... });

    return true;
  });
}

export async function recoverLoan(installmentId: string, payrollRef?: string) {
  return prisma.$transaction(async (tx) => {
    const installment = await tx.employeeLoanInstallment.findUniqueOrThrow({
      where: { id: installmentId },
      include: { loan: true }
    });

    if (installment.isRecovered) {
      throw new Error('Installment already recovered.');
    }

    // 1. Mark Recovered
    await tx.employeeLoanInstallment.update({
      where: { id: installmentId },
      data: {
        isRecovered: true,
        recoveryDate: new Date(),
        payrollReference: payrollRef
      }
    });

    // 2. Reduce Outstanding Balance
    const newBalance = Number(installment.loan.outstandingBalance) - Number(installment.amount);
    
    await tx.employeeLoan.update({
      where: { id: installment.loanId },
      data: {
        outstandingBalance: newBalance,
        status: newBalance <= 0 ? 'COMPLETED' : 'ACTIVE'
      }
    });

    // Transmit to Posting Engine
    // await createJournalEntry({ type: 'LOAN_RECOVERY', amount: installment.amount ... });

    return true;
  });
}

export async function closeLoan(loanId: string) {
  return prisma.employeeLoan.update({
    where: { id: loanId },
    data: { status: 'COMPLETED' }
  });
}

export async function calculateOutstanding(employeeId: string) {
  const loans = await prisma.employeeLoan.findMany({
    where: { employeeId, status: 'ACTIVE' }
  });
  return loans.reduce((sum, loan) => sum + Number(loan.outstandingBalance), 0);
}
