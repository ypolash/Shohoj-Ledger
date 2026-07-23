import { postingService, PostingRequest } from "@/lib/accounting/postingService";
import { Decimal } from "@prisma/client/runtime/library";

export const inventoryAccountingService = {
  validateInventoryPosting: (isApproved: boolean, companyId: string, branchId?: string) => {
    if (!isApproved) {
      throw new Error("Cannot post unapproved inventory document to Accounting.");
    }
    if (!companyId) {
      throw new Error("Company ID is required for Inventory Accounting integration.");
    }
  },

  postPurchase: async (
    companyId: string, 
    receiptId: string, 
    amount: number | Decimal, 
    inventoryAccountId: string, 
    accountsPayableId: string, 
    postedById: string,
    journalId: string,
    branchId?: string
  ) => {
    // 1. Debit: Inventory Asset, Credit: Accounts Payable
    const request: PostingRequest = {
      companyId,
      branchId,
      journalId,
      entryDate: new Date(),
      description: `Purchase Receipt #${receiptId}`,
      referenceType: 'PURCHASE_RECEIPT',
      referenceId: receiptId,
      createdById: postedById,
      lines: [
        { accountId: inventoryAccountId, debit: amount, credit: 0, description: "Inventory Received" },
        { accountId: accountsPayableId, debit: 0, credit: amount, description: "Supplier Payable" }
      ]
    };

    return postingService.post(request);
  },

  postSale: async (
    companyId: string, 
    issueId: string, 
    costAmount: number | Decimal, 
    revenueAmount: number | Decimal,
    cogsAccountId: string, 
    inventoryAccountId: string, 
    accountsReceivableId: string,
    salesRevenueAccountId: string,
    postedById: string,
    journalId: string,
    branchId?: string
  ) => {
    // Two parts: Revenue Recognition and Cost Recognition (Perpetual Inventory System)
    const request: PostingRequest = {
      companyId,
      branchId,
      journalId,
      entryDate: new Date(),
      description: `Sales Issue #${issueId}`,
      referenceType: 'SALES_ISSUE',
      referenceId: issueId,
      createdById: postedById,
      lines: [
        // Revenue Recognition
        { accountId: accountsReceivableId, debit: revenueAmount, credit: 0, description: "Customer Receivable" },
        { accountId: salesRevenueAccountId, debit: 0, credit: revenueAmount, description: "Sales Revenue" },
        // Cost Recognition
        { accountId: cogsAccountId, debit: costAmount, credit: 0, description: "Cost of Goods Sold" },
        { accountId: inventoryAccountId, debit: 0, credit: costAmount, description: "Inventory Issued" }
      ]
    };

    return postingService.post(request);
  },

  postAdjustment: async (
    companyId: string, 
    adjustmentId: string, 
    amount: number | Decimal, 
    isPositive: boolean,
    inventoryAccountId: string, 
    gainLossAccountId: string, 
    postedById: string,
    journalId: string,
    branchId?: string
  ) => {
    const lines = isPositive ? [
      { accountId: inventoryAccountId, debit: amount, credit: 0, description: "Inventory Gain" },
      { accountId: gainLossAccountId, debit: 0, credit: amount, description: "Inventory Gain" }
    ] : [
      { accountId: gainLossAccountId, debit: amount, credit: 0, description: "Inventory Loss" },
      { accountId: inventoryAccountId, debit: 0, credit: amount, description: "Inventory Loss" }
    ];

    const request: PostingRequest = {
      companyId,
      branchId,
      journalId,
      entryDate: new Date(),
      description: `Inventory Adjustment #${adjustmentId}`,
      referenceType: 'INVENTORY_ADJUSTMENT',
      referenceId: adjustmentId,
      createdById: postedById,
      lines
    };

    return postingService.post(request);
  },

  postReturn: async (
    companyId: string, 
    returnId: string, 
    costAmount: number | Decimal, 
    inventoryAccountId: string, 
    cogsAccountId: string, 
    postedById: string,
    journalId: string,
    branchId?: string
  ) => {
    // Reverse the COGS flow
    const request: PostingRequest = {
      companyId,
      branchId,
      journalId,
      entryDate: new Date(),
      description: `Sales Return #${returnId}`,
      referenceType: 'SALES_RETURN',
      referenceId: returnId,
      createdById: postedById,
      lines: [
        { accountId: inventoryAccountId, debit: costAmount, credit: 0, description: "Inventory Returned" },
        { accountId: cogsAccountId, debit: 0, credit: costAmount, description: "COGS Reversed" }
      ]
    };

    return postingService.post(request);
  },

  reverseInventoryPosting: async (
    companyId: string, 
    referenceType: string, 
    referenceId: string, 
    reversedById: string
  ) => {
    // Uses the Posting Engine's native reversal capability to ensure GAAP compliance
    return postingService.reverse(companyId, referenceType, referenceId, reversedById);
  }
};
