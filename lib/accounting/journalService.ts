import prisma from "@/lib/prisma";
import { JournalType } from "@prisma/client";

export const journalService = {
  createJournal: async (companyId: string, data: { code: string, name: string, journalType: JournalType, isActive?: boolean }) => {
    return prisma.journal.create({
      data: {
        companyId,
        ...data
      }
    });
  },

  updateJournal: async (companyId: string, id: string, data: { name?: string, journalType?: JournalType, isActive?: boolean }) => {
    return prisma.journal.update({
      where: { id, companyId },
      data
    });
  },

  listJournals: async (companyId: string) => {
    return prisma.journal.findMany({
      where: { companyId },
      orderBy: { code: 'asc' }
    });
  }
};
