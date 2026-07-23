import prisma from "@/lib/prisma";

export const fiscalYearService = {
  createFiscalYear: async (companyId: string, data: { name: string, startDate: Date, endDate: Date }) => {
    return prisma.fiscalYear.create({
      data: {
        companyId,
        ...data
      }
    });
  },

  closeFiscalYear: async (companyId: string, id: string) => {
    return prisma.fiscalYear.update({
      where: { id, companyId },
      data: { isClosed: true }
    });
  },

  getFiscalYears: async (companyId: string) => {
    return prisma.fiscalYear.findMany({
      where: { companyId },
      orderBy: { startDate: 'desc' }
    });
  }
};
