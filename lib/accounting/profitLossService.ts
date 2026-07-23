import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const profitLossService = {
  getRevenueAccounts: async (companyId: string, startDate: Date, endDate: Date, branchId?: string) => {
    // Only fetch INCOME accounts
    const accounts = await prisma.chartOfAccount.findMany({
      where: { companyId, accountType: 'INCOME' }
    });

    const entries = await prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      where: {
        companyId,
        accountId: { in: accounts.map(a => a.id) },
        entryDate: { gte: startDate, lte: endDate },
        ...(branchId && { branchId })
      },
      _sum: { debit: true, credit: true }
    });

    return accounts.map(account => {
      const entry = entries.find(e => e.accountId === account.id);
      // Income is credit normal. So balance = Credit - Debit
      const credit = entry?._sum.credit || new Decimal(0);
      const debit = entry?._sum.debit || new Decimal(0);
      const balance = (credit as Decimal).minus(debit as Decimal);
      
      return { ...account, balance };
    });
  },

  getExpenseAccounts: async (companyId: string, startDate: Date, endDate: Date, branchId?: string) => {
    // Only fetch EXPENSE accounts
    const accounts = await prisma.chartOfAccount.findMany({
      where: { companyId, accountType: 'EXPENSE' }
    });

    const entries = await prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      where: {
        companyId,
        accountId: { in: accounts.map(a => a.id) },
        entryDate: { gte: startDate, lte: endDate },
        ...(branchId && { branchId })
      },
      _sum: { debit: true, credit: true }
    });

    return accounts.map(account => {
      const entry = entries.find(e => e.accountId === account.id);
      // Expense is debit normal. So balance = Debit - Credit
      const debit = entry?._sum.debit || new Decimal(0);
      const credit = entry?._sum.credit || new Decimal(0);
      const balance = (debit as Decimal).minus(credit as Decimal);
      
      return { ...account, balance };
    });
  },

  calculateGrossProfit: (revenue: Decimal, cogs: Decimal) => {
    // Future COGS integration ready.
    return revenue.minus(cogs);
  },

  calculateOperatingProfit: (grossProfit: Decimal, operatingExpenses: Decimal) => {
    return grossProfit.minus(operatingExpenses);
  },

  calculateNetProfit: (operatingProfit: Decimal, otherIncome: Decimal, otherExpenses: Decimal, taxes: Decimal, interest: Decimal, depreciation: Decimal) => {
    return operatingProfit.add(otherIncome).minus(otherExpenses).minus(taxes).minus(interest).minus(depreciation);
  },

  generateProfitLoss: async (companyId: string, startDate: Date, endDate: Date, branchId?: string) => {
    const revenueAccounts = await profitLossService.getRevenueAccounts(companyId, startDate, endDate, branchId);
    const expenseAccounts = await profitLossService.getExpenseAccounts(companyId, startDate, endDate, branchId);

    const totalRevenue = revenueAccounts.reduce((acc, curr) => acc.add(curr.balance), new Decimal(0));
    const totalExpenses = expenseAccounts.reduce((acc, curr) => acc.add(curr.balance), new Decimal(0));

    // COGS implementation is mocked for future Phase
    const totalCogs = new Decimal(0); 

    const grossProfit = profitLossService.calculateGrossProfit(totalRevenue, totalCogs);
    
    // In future phases, expenses will be categorized into Operating, Other, Taxes, Interest, etc.
    const operatingExpenses = totalExpenses; 
    const operatingProfit = profitLossService.calculateOperatingProfit(grossProfit, operatingExpenses);

    // Placeholders for future advanced logic
    const otherIncome = new Decimal(0);
    const otherExpenses = new Decimal(0);
    const taxes = new Decimal(0);
    const interest = new Decimal(0);
    const depreciation = new Decimal(0);

    const netProfit = profitLossService.calculateNetProfit(operatingProfit, otherIncome, otherExpenses, taxes, interest, depreciation);

    return {
      revenue: {
        accounts: revenueAccounts,
        total: totalRevenue
      },
      cogs: {
        total: totalCogs
      },
      grossProfit,
      expenses: {
        operating: operatingExpenses,
        other: otherExpenses,
        taxes,
        interest,
        depreciation,
        accounts: expenseAccounts
      },
      otherIncome,
      operatingProfit,
      netProfit
    };
  },

  exportProfitLoss: async (companyId: string, startDate: Date, endDate: Date, format: 'PDF' | 'EXCEL' | 'CSV', branchId?: string) => {
    const pl = await profitLossService.generateProfitLoss(companyId, startDate, endDate, branchId);
    
    // Prepares the API integration layer for the frontend report builder
    return {
      message: `Export logic for ${format} is prepared for future implementation`,
      data: pl
    };
  }
};
