import { prisma } from './prisma';

type ModuleType = 'Income' | 'Expense' | 'Payroll' | 'Advance' | 'Loan' | 'Reserve' | 'Fund' | 'Settlement';
type AccountType = 'Cash' | 'Bank' | 'Mobile Banking' | 'Reserve' | 'Payable' | 'Receivable' | 'Other';

interface LedgerEntryPayload {
  companyId: string;
  module: ModuleType;
  referenceId?: string;
  amount: number;
  isDebit: boolean; // true if money is coming into the company's asset accounts (Bank/Cash increases). false if money is going out.
  accountType: AccountType | string;
  description?: string;
  createdById?: string;
}

export async function createLedgerEntry({
  companyId,
  module,
  referenceId,
  amount,
  isDebit,
  accountType,
  description,
  createdById
}: LedgerEntryPayload) {
  
  // 1. Determine Prefix and Voucher Type
  let prefix = 'VCH';
  let voucherType = 'Journal Voucher';
  
  switch (module) {
    case 'Income':
      prefix = 'INC';
      voucherType = 'Income Voucher';
      break;
    case 'Expense':
      prefix = 'EXP';
      voucherType = 'Expense Voucher';
      break;
    case 'Payroll':
      prefix = 'PAY';
      voucherType = 'Payment Voucher';
      break;
    case 'Advance':
      prefix = 'ADV';
      voucherType = 'Payment Voucher';
      break;
    case 'Loan':
      prefix = 'LON';
      voucherType = 'Transfer Voucher';
      break;
    case 'Reserve':
      prefix = 'RSV';
      voucherType = 'Transfer Voucher';
      break;
    case 'Fund':
      prefix = 'FND';
      voucherType = 'Transfer Voucher';
      break;
    case 'Settlement':
      prefix = 'STL';
      voucherType = 'Journal Voucher';
      break;
  }

  // 2. Generate sequential Voucher No inside a transaction to prevent race conditions if possible, 
  // but for simplicity in Shohoj Ledger, we'll fetch the last one.
  const lastEntry = await prisma.ledgerEntry.findFirst({
    where: { companyId, voucherNo: { startsWith: prefix } },
    orderBy: { createdAt: 'desc' }
  });

  let nextNumber = 1;
  if (lastEntry) {
    const lastNo = parseInt(lastEntry.voucherNo.replace(prefix + '-', ''));
    if (!isNaN(lastNo)) {
      nextNumber = lastNo + 1;
    }
  }
  const voucherNo = `${prefix}-${nextNumber.toString().padStart(4, '0')}`;

  // 3. Create Entry
  // Standard Accounting (Asset Perspective): 
  // Debit = Asset Increase (Money In). Credit = Asset Decrease (Money Out).
  const debitAmount = isDebit ? amount : 0;
  const creditAmount = !isDebit ? amount : 0;

  const entry = await prisma.ledgerEntry.create({
    data: {
      companyId,
      voucherNo,
      voucherType,
      referenceId,
      module,
      accountType,
      debit: debitAmount,
      credit: creditAmount,
      description,
      createdById
    }
  });

  return entry;
}
