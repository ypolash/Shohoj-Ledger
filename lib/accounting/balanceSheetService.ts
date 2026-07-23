import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const balanceSheetService = {
  getAssetAccounts: async (companyId: string, asOfDate: Date, branchId?: string) => {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { companyId, accountType: 'ASSET' }
    });

    const entries = await prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      where: {
        companyId,
        accountId: { in: accounts.map(a => a.id) },
        entryDate: { lte: asOfDate },
        ...(branchId && { branchId })
      },
      _sum: { debit: true, credit: true }
    });

    return accounts.map(account => {
      const entry = entries.find(e => e.accountId === account.id);
      // Asset is debit normal. So balance = Debit - Credit
      const debit = entry?._sum.debit || new Decimal(0);
      const credit = entry?._sum.credit || new Decimal(0);
      const balance = (debit as Decimal).minus(credit as Decimal);
      
      return { ...account, balance };
    });
  },

  getLiabilityAccounts: async (companyId: string, asOfDate: Date, branchId?: string) => {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { companyId, accountType: 'LIABILITY' }
    });

    const entries = await prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      where: {
        companyId,
        accountId: { in: accounts.map(a => a.id) },
        entryDate: { lte: asOfDate },
        ...(branchId && { branchId })
      },
      _sum: { debit: true, credit: true }
    });

    return accounts.map(account => {
      const entry = entries.find(e => e.accountId === account.id);
      // Liability is credit normal. So balance = Credit - Debit
      const credit = entry?._sum.credit || new Decimal(0);
      const debit = entry?._sum.debit || new Decimal(0);
      const balance = (credit as Decimal).minus(debit as Decimal);
      
      return { ...account, balance };
    });
  },

  getEquityAccounts: async (companyId: string, asOfDate: Date, branchId?: string) => {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { companyId, accountType: 'EQUITY' }
    });

    const entries = await prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      where: {
        companyId,
        accountId: { in: accounts.map(a => a.id) },
        entryDate: { lte: asOfDate },
        ...(branchId && { branchId })
      },
      _sum: { debit: true, credit: true }
    });

    return accounts.map(account => {
      const entry = entries.find(e => e.accountId === account.id);
      // Equity is credit normal. So balance = Credit - Debit
      const credit = entry?._sum.credit || new Decimal(0);
      const debit = entry?._sum.debit || new Decimal(0);
      const balance = (credit as Decimal).minus(debit as Decimal);
      
      return { ...account, balance };
    });
  },

  calculateTotalAssets: (assetAccounts: any[]) => {
    return assetAccounts.reduce((acc, curr) => acc.add(curr.balance), new Decimal(0));
  },

  calculateTotalLiabilities: (liabilityAccounts: any[]) => {
    return liabilityAccounts.reduce((acc, curr) => acc.add(curr.balance), new Decimal(0));
  },

  calculateTotalEquity: (equityAccounts: any[], retainedEarnings: Decimal) => {
    const coreEquity = equityAccounts.reduce((acc, curr) => acc.add(curr.balance), new Decimal(0));
    return coreEquity.add(retainedEarnings);
  },

  validateBalanceSheet: (totalAssets: Decimal, totalLiabilities: Decimal, totalEquity: Decimal) => {
    const liabilitiesAndEquity = totalLiabilities.add(totalEquity);
    // Assets = Liabilities + Equity
    return totalAssets.equals(liabilitiesAndEquity);
  },

  generateBalanceSheet: async (companyId: string, asOfDate: Date, branchId?: string) => {
    const assetAccounts = await balanceSheetService.getAssetAccounts(companyId, asOfDate, branchId);
    const liabilityAccounts = await balanceSheetService.getLiabilityAccounts(companyId, asOfDate, branchId);
    const equityAccounts = await balanceSheetService.getEquityAccounts(companyId, asOfDate, branchId);

    const totalAssets = balanceSheetService.calculateTotalAssets(assetAccounts);
    const totalLiabilities = balanceSheetService.calculateTotalLiabilities(liabilityAccounts);

    // Retained Earnings logic (Phase 2): Will calculate all Net Income from dawn of time minus dividends
    // For Phase 1F, we prepare the structural placeholder.
    const retainedEarnings = new Decimal(0); 

    const totalEquity = balanceSheetService.calculateTotalEquity(equityAccounts, retainedEarnings);
    
    // Future placeholders for granular classification
    const currentAssets = totalAssets; // Mocked until Chart of Accounts tracks classification
    const fixedAssets = new Decimal(0);
    const currentLiabilities = totalLiabilities;
    const longTermLiabilities = new Decimal(0);

    const isValid = balanceSheetService.validateBalanceSheet(totalAssets, totalLiabilities, totalEquity);

    return {
      assets: {
        accounts: assetAccounts,
        current: currentAssets,
        fixed: fixedAssets,
        total: totalAssets
      },
      liabilities: {
        accounts: liabilityAccounts,
        current: currentLiabilities,
        longTerm: longTermLiabilities,
        total: totalLiabilities
      },
      equity: {
        accounts: equityAccounts,
        retainedEarnings,
        total: totalEquity
      },
      totalLiabilitiesAndEquity: totalLiabilities.add(totalEquity),
      isValid
    };
  },

  exportBalanceSheet: async (companyId: string, asOfDate: Date, format: 'PDF' | 'EXCEL' | 'CSV', branchId?: string) => {
    const bs = await balanceSheetService.generateBalanceSheet(companyId, asOfDate, branchId);
    
    return {
      message: `Export logic for ${format} is prepared for future implementation`,
      data: bs
    };
  }
};
