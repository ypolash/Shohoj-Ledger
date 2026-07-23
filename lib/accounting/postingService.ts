import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { JournalEntryStatus } from "@prisma/client";

export class ValidationException extends Error { name = 'ValidationException'; }
export class PostingException extends Error { name = 'PostingException'; }
export class DuplicatePostingException extends Error { name = 'DuplicatePostingException'; }
export class ClosedPeriodException extends Error { name = 'ClosedPeriodException'; }
export class InactiveAccountException extends Error { name = 'InactiveAccountException'; }

export type PostingRequestLine = {
  accountId: string;
  debit: Decimal | number;
  credit: Decimal | number;
  description?: string;
};

export type PostingRequest = {
  companyId: string;
  branchId?: string;
  journalId: string;
  entryDate: Date;
  description?: string;
  referenceType: string;
  referenceId: string;
  createdById: string;
  lines: PostingRequestLine[];
};

export const postingService = {
  generateVoucherNumber: async (companyId: string, branchId: string | undefined, entryDate: Date, typePrefix: string) => {
    // Basic structural generator: [COMPANY]-[BRANCH]-[YEAR]-[TYPE]-[SEQ]
    const year = entryDate.getFullYear();
    const branchPrefix = branchId ? "BR" : "HQ";
    // In production, sequence would be an atomic lock or DB sequence.
    // We mock it for the architectural skeleton.
    const seq = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    return `C-${branchPrefix}-${year}-${typePrefix}-${seq}`;
  },

  validatePosting: async (request: PostingRequest) => {
    // 1. Company / Duplicate Isolation
    const existing = await prisma.journalEntry.findFirst({
      where: {
        companyId: request.companyId,
        referenceType: request.referenceType,
        referenceId: request.referenceId,
        status: { not: 'VOID' }
      }
    });

    if (existing) {
      throw new DuplicatePostingException(`Transaction ${request.referenceId} has already been posted.`);
    }

    // 2. Open Period Check
    const period = await prisma.accountingPeriod.findFirst({
      where: {
        companyId: request.companyId,
        isClosed: false,
        startDate: { lte: request.entryDate },
        endDate: { gte: request.entryDate }
      }
    });

    if (!period) {
      throw new ClosedPeriodException("Transaction date does not fall within an open accounting period.");
    }

    // 3. Balance Check
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);
    for (const line of request.lines) {
      totalDebit = totalDebit.add(line.debit);
      totalCredit = totalCredit.add(line.credit);
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new ValidationException(`Debits (${totalDebit}) must equal Credits (${totalCredit}).`);
    }

    // 4. Accounts Check
    const accountIds = request.lines.map(l => l.accountId);
    const accounts = await prisma.chartOfAccount.findMany({
      where: { companyId: request.companyId, id: { in: accountIds } }
    });

    if (accounts.length !== new Set(accountIds).size) {
      throw new InactiveAccountException("One or more accounts do not exist in this company.");
    }

    const inactive = accounts.filter(a => !a.isActive);
    if (inactive.length > 0) {
      throw new InactiveAccountException(`Account ${inactive[0].accountCode} is inactive.`);
    }

    return true;
  },

  createJournalEntry: async (tx: any, request: PostingRequest, voucherNumber: string) => {
    return tx.journalEntry.create({
      data: {
        companyId: request.companyId,
        branchId: request.branchId,
        journalId: request.journalId,
        entryNumber: voucherNumber,
        entryDate: request.entryDate,
        description: request.description,
        referenceType: request.referenceType,
        referenceId: request.referenceId,
        status: JournalEntryStatus.DRAFT, // Will be updated to POSTED upon completion
        createdById: request.createdById,
        approvedById: request.createdById, // Auto-approved by the poster in standard API flow
        approvedAt: new Date()
      }
    });
  },

  createJournalLines: async (tx: any, journalEntryId: string, lines: PostingRequestLine[]) => {
    // Using createMany for performance
    await tx.journalEntryLine.createMany({
      data: lines.map(line => ({
        journalEntryId,
        accountId: line.accountId,
        description: line.description,
        debit: line.debit,
        credit: line.credit
      }))
    });

    // Fetch them back to get IDs for Ledger mapping
    return tx.journalEntryLine.findMany({
      where: { journalEntryId }
    });
  },

  createLedgerEntries: async (tx: any, entry: any, lines: any[]) => {
    const ledgerData = lines.map(line => ({
      companyId: entry.companyId,
      branchId: entry.branchId,
      journalEntryId: entry.id,
      journalEntryLineId: line.id,
      accountId: line.accountId,
      entryDate: entry.entryDate,
      debit: line.debit,
      credit: line.credit,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      // Legacy V1.1 fallback mappings
      module: entry.referenceType,
      voucherNo: entry.entryNumber,
      voucherType: 'JV',
      accountType: 'TBD' // Should be fetched from ChartOfAccounts if needed
    }));

    await tx.ledgerEntry.createMany({
      data: ledgerData
    });
  },

  completePosting: async (tx: any, entryId: string, companyId: string) => {
    return tx.journalEntry.update({
      where: { id: entryId, companyId },
      data: { status: JournalEntryStatus.POSTED }
    });
  },

  post: async (request: PostingRequest) => {
    await postingService.validatePosting(request);
    const voucherNumber = await postingService.generateVoucherNumber(request.companyId, request.branchId, request.entryDate, "SYS");

    try {
      // Execute entire posting process within a single ACID transaction
      return await prisma.$transaction(async (tx) => {
        const entry = await postingService.createJournalEntry(tx, request, voucherNumber);
        const lines = await postingService.createJournalLines(tx, entry.id, request.lines);
        await postingService.createLedgerEntries(tx, entry, lines);
        const postedEntry = await postingService.completePosting(tx, entry.id, request.companyId);
        
        return postedEntry;
      });
    } catch (error: any) {
      throw new PostingException(`Failed to post transaction: ${error.message}`);
    }
  },

  reverse: async (companyId: string, referenceType: string, referenceId: string, reversedById: string) => {
    // Finds the original posted entry
    const originalEntry = await prisma.journalEntry.findFirst({
      where: { companyId, referenceType, referenceId, status: JournalEntryStatus.POSTED },
      include: { lines: true }
    });

    if (!originalEntry) throw new Error("Original posted entry not found.");

    // Create inversion request
    const inversionRequest: PostingRequest = {
      companyId: originalEntry.companyId,
      branchId: originalEntry.branchId || undefined,
      journalId: originalEntry.journalId,
      entryDate: new Date(), // Reversal date is now
      description: `REVERSAL of ${originalEntry.entryNumber}`,
      referenceType: `${originalEntry.referenceType}_REVERSAL`,
      referenceId: originalEntry.referenceId!,
      createdById: reversedById,
      lines: originalEntry.lines.map(line => ({
        accountId: line.accountId,
        debit: line.credit, // SWAP
        credit: line.debit, // SWAP
        description: `REVERSAL of ${originalEntry.entryNumber}`
      }))
    };

    return await prisma.$transaction(async (tx) => {
      // Post the reverse entry
      const reverseEntry = await postingService.post(inversionRequest);
      
      // Void the original entry
      await tx.journalEntry.update({
        where: { id: originalEntry.id },
        data: { status: JournalEntryStatus.VOID }
      });

      return reverseEntry;
    });
  }
};
