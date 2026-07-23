import prisma from "@/lib/prisma";

export const ledgerService = {
  getLedger: async (companyId: string, filter?: { branchId?: string, startDate?: Date, endDate?: Date }) => {
    return prisma.ledgerEntry.findMany({
      where: {
        companyId,
        ...(filter?.branchId && { branchId: filter.branchId }),
        ...(filter?.startDate || filter?.endDate ? {
          entryDate: {
            ...(filter.startDate && { gte: filter.startDate }),
            ...(filter.endDate && { lte: filter.endDate })
          }
        } : {})
      },
      orderBy: { entryDate: 'asc' },
      include: { account: true, journalEntry: true }
    });
  },

  getAccountLedger: async (companyId: string, accountId: string, filter?: { startDate?: Date, endDate?: Date }) => {
    return prisma.ledgerEntry.findMany({
      where: {
        companyId,
        accountId,
        ...(filter?.startDate || filter?.endDate ? {
          entryDate: {
            ...(filter.startDate && { gte: filter.startDate }),
            ...(filter.endDate && { lte: filter.endDate })
          }
        } : {})
      },
      orderBy: { entryDate: 'asc' },
      include: { journalEntry: true }
    });
  },

  getRunningBalance: async (companyId: string, accountId: string, date: Date) => {
    const entries = await prisma.ledgerEntry.findMany({
      where: {
        companyId,
        accountId,
        entryDate: { lte: date }
      },
      select: { debit: true, credit: true, account: { select: { accountType: true } } }
    });

    if (entries.length === 0) return 0;

    let balance = 0;
    for (const entry of entries) {
      const debit = Number(entry.debit) || 0;
      const credit = Number(entry.credit) || 0;
      
      if (['ASSET', 'EXPENSE'].includes(entry.account?.accountType || '')) {
        balance += (debit - credit);
      } else {
        balance += (credit - debit);
      }
    }
    return balance;
  },

  getOpeningBalance: async (companyId: string, accountId: string, periodStartDate: Date) => {
    // To get opening balance for a period, calculate running balance just before the period
    return ledgerService.getRunningBalance(companyId, accountId, new Date(periodStartDate.getTime() - 1));
  },

  getClosingBalance: async (companyId: string, accountId: string, periodEndDate: Date) => {
    return ledgerService.getRunningBalance(companyId, accountId, periodEndDate);
  },

  getLedgerSummary: async (companyId: string, filter?: { startDate?: Date, endDate?: Date }) => {
    const entries = await ledgerService.getLedger(companyId, filter);
    
    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach(entry => {
      totalDebit += Number(entry.debit) || 0;
      totalCredit += Number(entry.credit) || 0;
    });

    return { totalDebit, totalCredit };
  },

  validateLedger: async (companyId: string, accountId: string, journalEntryId: string) => {
    const account = await prisma.chartOfAccount.findUnique({
      where: { id: accountId, companyId }
    });
    if (!account) throw new Error("Account does not exist for this company");

    const journal = await prisma.journalEntry.findUnique({
      where: { id: journalEntryId, companyId }
    });
    if (!journal) throw new Error("Journal entry does not exist for this company");
    
    return true;
  }
};
