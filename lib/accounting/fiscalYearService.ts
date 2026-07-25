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
    const existing = await prisma.fiscalYear.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Record not found or access denied");
    return prisma.fiscalYear.update({
      where: { id },
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
