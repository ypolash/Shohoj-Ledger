import { prisma } from './prisma';

type ModuleType = 'Income' | 'Expense' | 'Payroll' | 'Advance' | 'Loan' | 'Reserve' | 'Fund' | 'Settlement';
type AccountType = 'Cash' | 'Bank' | 'Mobile Banking' | 'Reserve' | 'Payable' | 'Receivable' | 'Other';

interface LedgerEntryPayload {
  companyId: string;
  module: ModuleType;
  referenceId?: string;
  amount: number;
  isDebit: boolean; // true if money is entering the company's asset accounts (Bank/Cash +). false if money is leaving.
  accountType: AccountType | string;
  description?: string;
  createdById?: string;
  systemSource?: string;
}

/**
 * Creates a robust, collision-resistant General Ledger entry
 */
export async function createLedgerEntry({
  companyId,
  module,
  referenceId,
  amount,
  isDebit,
  accountType,
  description,
  createdById,
  systemSource = "LEGACY"
}: LedgerEntryPayload) {
  const safeAmount = Math.max(0, Math.round((Number(amount) || 0) * 100) / 100);
  if (safeAmount <= 0) return null;

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

  const debitAmount = isDebit ? safeAmount : 0;
  const creditAmount = !isDebit ? safeAmount : 0;

  // 2. Resilient Voucher Number Generation with Collision Handling
  let attempts = 0;
  let entry = null;

  while (attempts < 5) {
    try {
      const lastEntry = await prisma.ledgerEntry.findFirst({
        where: { companyId, voucherNo: { startsWith: prefix }, systemSource },
        orderBy: { createdAt: 'desc' }
      });

      let nextNumber = 1;
      if (lastEntry) {
        const parts = lastEntry.voucherNo.split('-');
        const lastNo = parseInt(parts[1], 10);
        if (!isNaN(lastNo)) {
          nextNumber = lastNo + 1 + attempts;
        }
      }

      const voucherSuffix = attempts > 0 ? `-${Math.floor(100 + Math.random() * 900)}` : '';
      const voucherNo = `${prefix}-${nextNumber.toString().padStart(4, '0')}${voucherSuffix}`;

      entry = await prisma.ledgerEntry.create({
        data: {
          companyId,
          voucherNo,
          voucherType,
          referenceId,
          module,
          accountType: accountType || 'Bank',
          debit: debitAmount,
          credit: creditAmount,
          description: description || `${voucherType} for ${module}`,
          createdById,
          systemSource
        }
      });

      break;
    } catch (err: any) {
      attempts++;
      if (attempts >= 5) {
        // Fallback with timestamp-based unique voucher
        const fallbackNo = `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;
        entry = await prisma.ledgerEntry.create({
          data: {
            companyId,
            voucherNo: fallbackNo,
            voucherType,
            referenceId,
            module,
            accountType: accountType || 'Bank',
            debit: debitAmount,
            credit: creditAmount,
            description: description || `${voucherType} for ${module}`,
            createdById,
            systemSource
          }
        });
        break;
      }
    }
  }

  return entry;
}

/**
 * Reverses a previously posted ledger transaction (e.g. on expense/income cancellation)
 */
export async function reverseLedgerEntry({
  companyId,
  referenceId,
  module,
  reason,
  userId
}: {
  companyId: string;
  referenceId: string;
  module: ModuleType;
  reason?: string;
  userId?: string;
}) {
  const originalEntries = await prisma.ledgerEntry.findMany({
    where: { companyId, referenceId, module },
    orderBy: { createdAt: 'desc' }
  });

  if (originalEntries.length === 0) return null;

  for (const original of originalEntries) {
    const origDebit = Number(original.debit);
    const origCredit = Number(original.credit);
    const wasDebit = origDebit > 0;
    const amount = wasDebit ? origDebit : origCredit;

    // Create opposite entry to balance the books
    await createLedgerEntry({
      companyId,
      module,
      referenceId: `${referenceId}-REV`,
      amount,
      isDebit: !wasDebit, // Flip Debit <-> Credit
      accountType: original.accountType,
      description: `REVERSAL: ${reason || 'Transaction cancelled'} (Ref: ${original.voucherNo})`,
      createdById: userId,
      systemSource: original.systemSource
    });
  }
}
