import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const trialBalanceService = {
  getOpeningBalances: async (companyId: string, startDate: Date, branchId?: string) => {
    // Summarize ledger entries before startDate
    const entries = await prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      where: {
        companyId,
        entryDate: { lt: startDate },
        ...(branchId && { branchId })
      },
      _sum: {
        debit: true,
        credit: true
      }
    });

    return entries.map(entry => ({
      accountId: entry.accountId,
      openingDebit: entry._sum.debit || new Decimal(0),
      openingCredit: entry._sum.credit || new Decimal(0)
    }));
  },

  getPeriodMovements: async (companyId: string, startDate: Date, endDate: Date, branchId?: string) => {
    // Summarize ledger entries within the date range
    const entries = await prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      where: {
        companyId,
        entryDate: { gte: startDate, lte: endDate },
        ...(branchId && { branchId })
      },
      _sum: {
        debit: true,
        credit: true
      }
    });

    return entries.map(entry => ({
      accountId: entry.accountId,
      periodDebit: entry._sum.debit || new Decimal(0),
      periodCredit: entry._sum.credit || new Decimal(0)
    }));
  },

  getClosingBalances: async (companyId: string, endDate: Date, branchId?: string) => {
    // Summarize ledger entries up to endDate
    const entries = await prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      where: {
        companyId,
        entryDate: { lte: endDate },
        ...(branchId && { branchId })
      },
      _sum: {
        debit: true,
        credit: true
      }
    });

    return entries.map(entry => ({
      accountId: entry.accountId,
      closingDebit: entry._sum.debit || new Decimal(0),
      closingCredit: entry._sum.credit || new Decimal(0)
    }));
  },

  generateTrialBalance: async (companyId: string, startDate: Date, endDate: Date, branchId?: string) => {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { companyId },
      select: { id: true, accountCode: true, accountName: true, accountType: true }
    });

    const openingBalances = await trialBalanceService.getOpeningBalances(companyId, startDate, branchId);
    const periodMovements = await trialBalanceService.getPeriodMovements(companyId, startDate, endDate, branchId);
    const closingBalances = await trialBalanceService.getClosingBalances(companyId, endDate, branchId);

    let totalClosingDebit = new Decimal(0);
    let totalClosingCredit = new Decimal(0);

    const report = accounts.map(account => {
      const ob = openingBalances.find(ob => ob.accountId === account.id) || { openingDebit: new Decimal(0), openingCredit: new Decimal(0) };
      const pm = periodMovements.find(pm => pm.accountId === account.id) || { periodDebit: new Decimal(0), periodCredit: new Decimal(0) };
      const cb = closingBalances.find(cb => cb.accountId === account.id) || { closingDebit: new Decimal(0), closingCredit: new Decimal(0) };

      // Normal balance calculation based on account type
      let finalDebit = new Decimal(0);
      let finalCredit = new Decimal(0);

      const netBalance = (cb.closingDebit as Decimal).minus(cb.closingCredit as Decimal);

      if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
        if (netBalance.gte(0)) {
          finalDebit = netBalance;
        } else {
          finalCredit = netBalance.absoluteValue();
        }
      } else {
        if (netBalance.lte(0)) {
          finalCredit = netBalance.absoluteValue();
        } else {
          finalDebit = netBalance;
        }
      }

      totalClosingDebit = totalClosingDebit.add(finalDebit);
      totalClosingCredit = totalClosingCredit.add(finalCredit);

      return {
        ...account,
        openingDebit: ob.openingDebit,
        openingCredit: ob.openingCredit,
        periodDebit: pm.periodDebit,
        periodCredit: pm.periodCredit,
        closingDebit: finalDebit,
        closingCredit: finalCredit
      };
    });

    return {
      report,
      totals: {
        totalClosingDebit,
        totalClosingCredit,
        isBalanced: totalClosingDebit.equals(totalClosingCredit)
      }
    };
  },

  validateTrialBalance: async (companyId: string, startDate: Date, endDate: Date) => {
    const tb = await trialBalanceService.generateTrialBalance(companyId, startDate, endDate);
    if (!tb.totals.isBalanced) {
      throw new Error(`Trial Balance mismatch! Debit: ${tb.totals.totalClosingDebit}, Credit: ${tb.totals.totalClosingCredit}`);
    }
    return true;
  },

  exportTrialBalance: async (companyId: string, startDate: Date, endDate: Date, format: 'PDF' | 'EXCEL' | 'CSV', branchId?: string) => {
    const tb = await trialBalanceService.generateTrialBalance(companyId, startDate, endDate, branchId);
    
    // In Phase 1D, we are not building the actual export logic / UI yet. 
    // This prepares the architecture for future V1.3 UI rollout.
    return {
      message: `Export logic for ${format} is prepared for future implementation`,
      data: tb
    };
  }
};
