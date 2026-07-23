import prisma from "@/lib/prisma";
import { AccountType } from "@prisma/client";

export const chartOfAccountService = {
  createAccount: async (companyId: string, data: { accountCode: string, accountName: string, accountType: AccountType, parentId?: string, isSystem?: boolean, isActive?: boolean }) => {
    return prisma.chartOfAccount.create({
      data: {
        companyId,
        ...data
      }
    });
  },

  updateAccount: async (companyId: string, id: string, data: { accountName?: string, accountType?: AccountType, parentId?: string, isSystem?: boolean, isActive?: boolean }) => {
    return prisma.chartOfAccount.update({
      where: { id, companyId },
      data
    });
  },

  disableAccount: async (companyId: string, id: string) => {
    return prisma.chartOfAccount.update({
      where: { id, companyId },
      data: { isActive: false }
    });
  },

  getAccounts: async (companyId: string) => {
    return prisma.chartOfAccount.findMany({
      where: { companyId },
      orderBy: { accountCode: 'asc' }
    });
  },

  getAccountTree: async (companyId: string) => {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { companyId },
      orderBy: { accountCode: 'asc' }
    });
    
    const accountMap = new Map();
    accounts.forEach(acc => accountMap.set(acc.id, { ...acc, children: [] }));
    
    const tree: any[] = [];
    accountMap.forEach(acc => {
      if (acc.parentId) {
        const parent = accountMap.get(acc.parentId);
        if (parent) {
          parent.children.push(acc);
        }
      } else {
        tree.push(acc);
      }
    });
    
    return tree;
  }
};
