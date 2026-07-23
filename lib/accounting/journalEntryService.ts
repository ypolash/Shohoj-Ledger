import prisma from "@/lib/prisma";
import { JournalEntryStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export const journalEntryService = {
  createDraft: async (companyId: string, data: { branchId?: string, journalId: string, entryNumber: string, entryDate: Date, description?: string, referenceType?: string, referenceId?: string, createdById: string }) => {
    return prisma.journalEntry.create({
      data: {
        companyId,
        status: JournalEntryStatus.DRAFT,
        ...data
      }
    });
  },

  addLine: async (companyId: string, journalEntryId: string, data: { accountId: string, description?: string, debit?: number | Decimal, credit?: number | Decimal }) => {
    // Basic authorization check could be added here
    return prisma.journalEntryLine.create({
      data: {
        journalEntryId,
        ...data
      }
    });
  },

  removeLine: async (companyId: string, lineId: string) => {
    return prisma.journalEntryLine.delete({
      where: { id: lineId }
    });
  },

  validateEntry: async (companyId: string, journalEntryId: string) => {
    const entry = await prisma.journalEntry.findUnique({
      where: { id: journalEntryId, companyId },
      include: { lines: { include: { account: true } } }
    });

    if (!entry) throw new Error("Journal entry not found");

    if (entry.lines.length < 2) {
      throw new Error("Journal entry must have at least two lines");
    }

    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const line of entry.lines) {
      if (!line.account.isActive) {
        throw new Error(`Account ${line.account.accountCode} is inactive`);
      }
      totalDebit = totalDebit.add(line.debit);
      totalCredit = totalCredit.add(line.credit);
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new Error("Journal entry debits and credits do not balance");
    }

    // Open accounting period validation
    const period = await prisma.accountingPeriod.findFirst({
      where: {
        companyId,
        isClosed: false,
        startDate: { lte: entry.entryDate },
        endDate: { gte: entry.entryDate }
      }
    });

    if (!period) {
      throw new Error("Transaction date does not fall within an open accounting period");
    }

    return true;
  },

  submitForPosting: async (companyId: string, journalEntryId: string, approvedById: string) => {
    // 1. Validate rules
    await journalEntryService.validateEntry(companyId, journalEntryId);

    // 2. Mark as POSTED
    // DO NOT update ledgers (as per strict instructions, Phase 1B stops before posting logic)
    return prisma.journalEntry.update({
      where: { id: journalEntryId, companyId },
      data: {
        status: JournalEntryStatus.POSTED,
        approvedById,
        approvedAt: new Date()
      }
    });
  },

  getEntries: async (companyId: string) => {
    return prisma.journalEntry.findMany({
      where: { companyId },
      orderBy: { entryDate: 'desc' }
    });
  },

  getEntry: async (companyId: string, journalEntryId: string) => {
    return prisma.journalEntry.findUnique({
      where: { id: journalEntryId, companyId },
      include: { lines: true }
    });
  },

  voidEntry: async (companyId: string, journalEntryId: string) => {
    return prisma.journalEntry.update({
      where: { id: journalEntryId, companyId },
      data: { status: JournalEntryStatus.VOID }
    });
  }
};
