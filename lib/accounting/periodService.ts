import prisma from "@/lib/prisma";

export const periodService = {
  createPeriods: async (companyId: string, fiscalYearId: string, periods: { name: string, startDate: Date, endDate: Date }[]) => {
    return prisma.$transaction(
      periods.map(period => 
        prisma.accountingPeriod.create({
          data: {
            companyId,
            fiscalYearId,
            ...period
          }
        })
      )
    );
  },

  closePeriod: async (companyId: string, id: string) => {
    const existing = await prisma.accountingPeriod.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Record not found or access denied");
    return prisma.accountingPeriod.update({
      where: { id },
      data: { isClosed: true }
    });
  },

  getOpenPeriod: async (companyId: string, date: Date) => {
    return prisma.accountingPeriod.findFirst({
      where: {
        companyId,
        isClosed: false,
        startDate: { lte: date },
        endDate: { gte: date }
      }
    });
  }
};
