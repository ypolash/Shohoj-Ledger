import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Mock helper to classify cash flow categories based on account metadata in Phase 2
// For now, we mock the classification logic until Chart of Account expands with CF categories.
const classifyAccount = (accountName: string, accountType: string) => {
  const name = accountName.toLowerCase();
  if (['cash', 'bank', 'petty cash'].some(kw => name.includes(kw))) return 'CASH_EQUIVALENT';
  if (name.includes('loan') || name.includes('equity') || name.includes('dividend')) return 'FINANCING';
  if (name.includes('asset') || name.includes('equipment') || name.includes('investment')) return 'INVESTING';
  return 'OPERATING';
};

export const cashFlowService = {
  getOperatingActivities: async (companyId: string, startDate: Date, endDate: Date, branchId?: string) => {
    // In future indirect-method implementation, this will start with Net Income
    // and adjust for non-cash items (depreciation) and working capital changes.
    // For now, prepared with placeholders.
    const netIncome = new Decimal(0);
    const depreciationAdjustments = new Decimal(0);
    const workingCapitalChanges = new Decimal(0);
    const taxPayments = new Decimal(0);
    const interestPayments = new Decimal(0);

    const totalOperatingCashFlow = netIncome.add(depreciationAdjustments).add(workingCapitalChanges).minus(taxPayments).minus(interestPayments);

    return {
      netIncome,
      depreciationAdjustments,
      workingCapitalChanges,
      taxPayments,
      interestPayments,
      total: totalOperatingCashFlow
    };
  },

  getInvestingActivities: async (companyId: string, startDate: Date, endDate: Date, branchId?: string) => {
    // Placeholders for Investing Activities (Property, Plant, Equipment, Investments)
    const totalInvestingCashFlow = new Decimal(0);

    return {
      total: totalInvestingCashFlow
    };
  },

  getFinancingActivities: async (companyId: string, startDate: Date, endDate: Date, branchId?: string) => {
    // Placeholders for Financing Activities (Loans, Equity, Dividends)
    const totalFinancingCashFlow = new Decimal(0);

    return {
      total: totalFinancingCashFlow
    };
  },

  calculateOpeningCash: async (companyId: string, startDate: Date, branchId?: string) => {
    // Sum of all CASH_EQUIVALENT accounts before startDate
    const accounts = await prisma.chartOfAccount.findMany({
      where: { companyId }
    });
    
    const cashAccounts = accounts.filter(a => classifyAccount(a.accountName, a.accountType) === 'CASH_EQUIVALENT');

    const entries = await prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      where: {
        companyId,
        accountId: { in: cashAccounts.map(a => a.id) },
        entryDate: { lt: startDate },
        ...(branchId && { branchId })
      },
      _sum: { debit: true, credit: true }
    });

    let openingCash = new Decimal(0);
    for (const entry of entries) {
      // Cash is an asset, so normal balance is Debit
      const debit = entry._sum.debit || new Decimal(0);
      const credit = entry._sum.credit || new Decimal(0);
      openingCash = openingCash.add(debit.minus(credit));
    }

    return openingCash;
  },

  calculateClosingCash: async (companyId: string, endDate: Date, branchId?: string) => {
    // Sum of all CASH_EQUIVALENT accounts up to endDate
    const accounts = await prisma.chartOfAccount.findMany({
      where: { companyId }
    });
    
    const cashAccounts = accounts.filter(a => classifyAccount(a.accountName, a.accountType) === 'CASH_EQUIVALENT');

    const entries = await prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      where: {
        companyId,
        accountId: { in: cashAccounts.map(a => a.id) },
        entryDate: { lte: endDate },
        ...(branchId && { branchId })
      },
      _sum: { debit: true, credit: true }
    });

    let closingCash = new Decimal(0);
    for (const entry of entries) {
      const debit = entry._sum.debit || new Decimal(0);
      const credit = entry._sum.credit || new Decimal(0);
      closingCash = closingCash.add(debit.minus(credit));
    }

    return closingCash;
  },

  calculateNetCashFlow: (operating: Decimal, investing: Decimal, financing: Decimal) => {
    return operating.add(investing).add(financing);
  },

  generateCashFlow: async (companyId: string, startDate: Date, endDate: Date, branchId?: string) => {
    const openingCash = await cashFlowService.calculateOpeningCash(companyId, startDate, branchId);
    
    const operatingActivities = await cashFlowService.getOperatingActivities(companyId, startDate, endDate, branchId);
    const investingActivities = await cashFlowService.getInvestingActivities(companyId, startDate, endDate, branchId);
    const financingActivities = await cashFlowService.getFinancingActivities(companyId, startDate, endDate, branchId);

    const netCashMovement = cashFlowService.calculateNetCashFlow(operatingActivities.total, investingActivities.total, financingActivities.total);
    
    // We can also calculate closing cash directly from ledger as a verification step
    const theoreticalClosingCash = openingCash.add(netCashMovement);
    const actualClosingCash = await cashFlowService.calculateClosingCash(companyId, endDate, branchId);

    return {
      openingCash,
      operatingActivities,
      investingActivities,
      financingActivities,
      netCashMovement,
      theoreticalClosingCash, // Opening + Net
      actualClosingCash       // Straight from Ledger
    };
  },

  exportCashFlow: async (companyId: string, startDate: Date, endDate: Date, format: 'PDF' | 'EXCEL' | 'CSV', branchId?: string) => {
    const cf = await cashFlowService.generateCashFlow(companyId, startDate, endDate, branchId);
    
    // API integration layer placeholder for future UI export
    return {
      message: `Export logic for ${format} is prepared for future implementation`,
      data: cf
    };
  }
};
