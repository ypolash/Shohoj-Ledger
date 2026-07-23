import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { SupplierInvoiceStatus, ThreeWayMatchStatus } from "@prisma/client";
import { performThreeWayMatch } from "./threeWayMatchService";
import { postJournalEntry } from "@/lib/accounting/postingService";

/**
 * Enterprise Supplier Invoice Engine (Version 1.4 Phase 7)
 * 
 * Supplier Invoice is the FIRST procurement document allowed to create accounting entries.
 */

export async function createInvoice(companyId: string, userId: string, data: any) {
  const invoiceNumber = data.invoiceNumber || await generateInvoiceNumber(companyId);

  const invoice = await prisma.supplierInvoice.create({
    data: {
      companyId,
      invoiceNumber,
      supplierId: data.supplierId,
      purchaseOrderId: data.purchaseOrderId,
      goodsReceiptNoteId: data.goodsReceiptNoteId,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      currency: data.currency || "USD",
      status: SupplierInvoiceStatus.DRAFT,
      remarks: data.remarks,
      createdById: userId,
      lines: {
        create: data.lines.map((line: any) => ({
          purchaseOrderLineId: line.purchaseOrderLineId,
          goodsReceiptLineId: line.goodsReceiptLineId,
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountAmount: line.discountAmount || 0,
          taxAmount: line.taxAmount || 0,
          lineTotal: (Number(line.quantity) * Number(line.unitPrice)) - Number(line.discountAmount || 0) + Number(line.taxAmount || 0)
        }))
      }
    },
    include: { lines: true }
  });

  const subtotal = invoice.lines.reduce((sum, line) => sum + (Number(line.quantity) * Number(line.unitPrice)), 0);
  const discountAmount = invoice.lines.reduce((sum, line) => sum + Number(line.discountAmount), 0);
  const taxAmount = invoice.lines.reduce((sum, line) => sum + Number(line.taxAmount), 0);
  const shippingAmount = Number(data.shippingAmount || 0);
  const totalAmount = subtotal - discountAmount + taxAmount + shippingAmount;

  const updatedInvoice = await prisma.supplierInvoice.update({
    where: { id: invoice.id },
    data: {
      subtotal,
      discountAmount,
      taxAmount,
      shippingAmount,
      totalAmount
    },
    include: { lines: true }
  });

  await logAudit({
    module: "PROCUREMENT",
    entityType: "SupplierInvoice",
    entityId: invoice.id,
    action: "CREATE",
    description: `Created Supplier Invoice ${invoice.invoiceNumber}`
  });

  return updatedInvoice;
}

export async function approveInvoice(companyId: string, userId: string, id: string) {
  const invoice = await validateInvoice(companyId, id, ["DRAFT", "UNDER_REVIEW", "SUBMITTED"]);

  // Must perform a three-way match before approval (or implicitly triggers it)
  if (invoice.purchaseOrderId && invoice.goodsReceiptNoteId) {
    const match = await performThreeWayMatch(companyId, invoice.purchaseOrderId, invoice.goodsReceiptNoteId, id);
    if (match.matchStatus !== "MATCHED" && match.matchStatus !== "APPROVED") {
      throw new Error(`Cannot approve invoice. Three-Way Match status is ${match.matchStatus}. Please resolve variances first.`);
    }
  }

  const updated = await prisma.supplierInvoice.update({
    where: { id },
    data: { 
      status: SupplierInvoiceStatus.APPROVED,
      approvedById: userId,
      approvedAt: new Date()
    }
  });

  await logAudit({
    module: "PROCUREMENT",
    entityType: "SupplierInvoice",
    entityId: id,
    action: "APPROVAL",
    description: `Approved Supplier Invoice ${invoice.invoiceNumber}`
  });

  return updated;
}

export async function postInvoice(companyId: string, userId: string, id: string) {
  const invoice = await validateInvoice(companyId, id, ["APPROVED"]);

  // Supplier Invoice generates the first Accounts Payable liability.
  // We use the existing Posting Engine structure.
  
  // Simulated Journal Entry map (Assuming standard accounts setup from V1.3):
  // Debit: Inventory/GRNI (Goods Receipt Not Invoiced clearing account)
  // Credit: Accounts Payable
  
  await createPosting(companyId, invoice, userId);

  const updated = await prisma.supplierInvoice.update({
    where: { id },
    data: { status: SupplierInvoiceStatus.POSTED }
  });

  await logAudit({
    module: "PROCUREMENT",
    entityType: "SupplierInvoice",
    entityId: id,
    action: "POST",
    description: `Posted Supplier Invoice ${invoice.invoiceNumber} to General Ledger`
  });

  return updated;
}

export async function cancelInvoice(companyId: string, userId: string, id: string, reason: string) {
  const invoice = await validateInvoice(companyId, id, ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED"]);

  const updated = await prisma.supplierInvoice.update({
    where: { id },
    data: { 
      status: SupplierInvoiceStatus.CANCELLED,
      remarks: invoice.remarks ? `${invoice.remarks}\nCancel Reason: ${reason}` : `Cancel Reason: ${reason}`
    }
  });

  await logAudit({
    module: "PROCUREMENT",
    entityType: "SupplierInvoice",
    entityId: id,
    action: "UPDATE",
    description: `Cancelled Supplier Invoice ${invoice.invoiceNumber}. Reason: ${reason}`
  });

  return updated;
}

export async function generateInvoiceNumber(companyId: string): Promise<string> {
  const count = await prisma.supplierInvoice.count({ where: { companyId } });
  return `INV-${(count + 1).toString().padStart(5, '0')}`;
}

export async function validateInvoice(companyId: string, id: string, allowedStatuses: SupplierInvoiceStatus[]) {
  const invoice = await prisma.supplierInvoice.findUnique({ where: { id, companyId } });
  if (!invoice) throw new Error("Supplier Invoice not found.");
  if (!allowedStatuses.includes(invoice.status)) {
    throw new Error(`Invalid status transition. Current status: ${invoice.status}. Required: ${allowedStatuses.join(", ")}`);
  }
  return invoice;
}

async function createPosting(companyId: string, invoice: any, userId: string) {
  // We integrate with V1.3 Posting Engine `postJournalEntry`
  // Note: Standard mappings for AP would be pulled from ChartOfAccounts via posting rules
  // For demonstration per contract, we simply invoke the existing framework logically.
  
  const entries = [
    { accountCode: "AP-PAYABLES", debit: 0, credit: Number(invoice.totalAmount) },
    { accountCode: "AP-CLEARING", debit: Number(invoice.subtotal), credit: 0 },
    // If tax/shipping exists, map them to respective expense/clearing accounts
  ];

  if (invoice.taxAmount > 0) {
    entries.push({ accountCode: "TAX-IN", debit: Number(invoice.taxAmount), credit: 0 });
  }
  if (invoice.shippingAmount > 0) {
    entries.push({ accountCode: "EXP-SHIPPING", debit: Number(invoice.shippingAmount), credit: 0 });
  }

  // Pass to the core PostingService
  await postJournalEntry(companyId, {
    date: new Date(),
    reference: `Supplier Invoice: ${invoice.invoiceNumber}`,
    description: `Accounts Payable recording for ${invoice.invoiceNumber}`,
    lines: entries,
    sourceModule: "PROCUREMENT",
    sourceId: invoice.id,
    createdById: userId
  });
}

export async function getInvoiceHistory(companyId: string, id: string) {
  return prisma.globalAuditLog.findMany({
    where: { companyId, entityType: "SupplierInvoice", entityId: id },
    orderBy: { createdAt: 'desc' }
  });
}
