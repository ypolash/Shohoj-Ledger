import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { SupplierPaymentStatus, PaymentMethod } from "@prisma/client";
import { postJournalEntry } from "@/lib/accounting/postingService";

/**
 * Enterprise Supplier Payment Engine (Version 1.4 Phase 8)
 * 
 * Manages outgoing cash flow, partial invoice allocations, and AP ledger deductions.
 */

export async function createPayment(companyId: string, userId: string, data: any) {
  const paymentNumber = data.paymentNumber || await generatePaymentNumber(companyId);
  const amount = Number(data.amount);

  const payment = await prisma.supplierPayment.create({
    data: {
      companyId,
      paymentNumber,
      supplierId: data.supplierId,
      paymentDate: new Date(data.paymentDate),
      paymentMethod: data.paymentMethod as PaymentMethod || PaymentMethod.BANK,
      referenceNumber: data.referenceNumber,
      bankAccountId: data.bankAccountId,
      currency: data.currency || "USD",
      amount,
      allocatedAmount: 0,
      unallocatedAmount: amount,
      status: SupplierPaymentStatus.DRAFT,
      remarks: data.remarks,
      createdById: userId
    }
  });

  await logAudit({
    module: "PROCUREMENT",
    entityType: "SupplierPayment",
    entityId: payment.id,
    action: "CREATE",
    description: `Created Supplier Payment ${payment.paymentNumber} for ${payment.currency} ${payment.amount}`
  });

  return payment;
}

export async function updatePayment(companyId: string, userId: string, id: string, data: any) {
  const existing = await validatePayment(companyId, id, ["DRAFT"]);

  const amount = data.amount ? Number(data.amount) : Number(existing.amount);

  const payment = await prisma.supplierPayment.update({
    where: { id },
    data: {
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : existing.paymentDate,
      paymentMethod: data.paymentMethod || existing.paymentMethod,
      referenceNumber: data.referenceNumber ?? existing.referenceNumber,
      bankAccountId: data.bankAccountId ?? existing.bankAccountId,
      amount,
      unallocatedAmount: amount - Number(existing.allocatedAmount),
      remarks: data.remarks ?? existing.remarks
    }
  });

  await logAudit({
    module: "PROCUREMENT",
    entityType: "SupplierPayment",
    entityId: id,
    action: "UPDATE",
    description: `Updated Supplier Payment ${existing.paymentNumber}`
  });

  return payment;
}

export async function postPayment(companyId: string, userId: string, id: string) {
  const payment = await validatePayment(companyId, id, ["DRAFT"]);

  // Supplier Payment reduces Accounts Payable and reduces Cash/Bank
  // Posting to the General Ledger via the core Posting Engine.
  await createPosting(companyId, payment, userId);

  const newStatus = Number(payment.allocatedAmount) >= Number(payment.amount) 
    ? SupplierPaymentStatus.FULLY_ALLOCATED 
    : (Number(payment.allocatedAmount) > 0 ? SupplierPaymentStatus.PARTIALLY_ALLOCATED : SupplierPaymentStatus.POSTED);

  const updated = await prisma.supplierPayment.update({
    where: { id },
    data: { status: newStatus }
  });

  await logAudit({
    module: "PROCUREMENT",
    entityType: "SupplierPayment",
    entityId: id,
    action: "POST",
    description: `Posted Supplier Payment ${payment.paymentNumber} to General Ledger`
  });

  return updated;
}

export async function allocatePayment(companyId: string, userId: string, paymentId: string, invoiceId: string, allocationAmount: number) {
  const payment = await prisma.supplierPayment.findUnique({ where: { id: paymentId, companyId } });
  if (!payment) throw new Error("Supplier Payment not found.");
  
  if (payment.status === "CANCELLED" || payment.status === "DRAFT") {
    throw new Error("Cannot allocate against DRAFT or CANCELLED payments. Please post payment first.");
  }

  if (Number(payment.unallocatedAmount) < allocationAmount) {
    throw new Error(`Allocation amount (${allocationAmount}) exceeds unallocated balance (${payment.unallocatedAmount}).`);
  }

  const invoice = await prisma.supplierInvoice.findUnique({ where: { id: invoiceId, companyId } });
  if (!invoice) throw new Error("Supplier Invoice not found.");
  if (invoice.status !== "POSTED") throw new Error("Can only allocate against POSTED supplier invoices.");

  // Calculate invoice outstanding balance
  const outstanding = await calculateOutstanding(companyId, invoiceId);
  if (outstanding < allocationAmount) {
    throw new Error(`Allocation amount (${allocationAmount}) exceeds invoice outstanding balance (${outstanding}).`);
  }

  const allocation = await prisma.supplierPaymentAllocation.create({
    data: {
      supplierPaymentId: paymentId,
      supplierInvoiceId: invoiceId,
      allocatedAmount: allocationAmount
    }
  });

  const newAllocated = Number(payment.allocatedAmount) + allocationAmount;
  const newUnallocated = Number(payment.unallocatedAmount) - allocationAmount;
  
  let newStatus = payment.status;
  if (newUnallocated <= 0) {
    newStatus = SupplierPaymentStatus.FULLY_ALLOCATED;
  } else if (newAllocated > 0) {
    newStatus = SupplierPaymentStatus.PARTIALLY_ALLOCATED;
  }

  await prisma.supplierPayment.update({
    where: { id: paymentId },
    data: {
      allocatedAmount: newAllocated,
      unallocatedAmount: newUnallocated,
      status: newStatus
    }
  });

  await logAudit({
    module: "PROCUREMENT",
    entityType: "SupplierPayment",
    entityId: paymentId,
    action: "ALLOCATE",
    description: `Allocated ${allocationAmount} to Invoice ${invoice.invoiceNumber}`
  });

  return allocation;
}

export async function removeAllocation(companyId: string, userId: string, allocationId: string) {
  const allocation = await prisma.supplierPaymentAllocation.findUnique({
    where: { id: allocationId },
    include: { supplierPayment: true }
  });

  if (!allocation) throw new Error("Allocation not found.");
  if (allocation.supplierPayment.companyId !== companyId) throw new Error("Unauthorized.");

  const payment = allocation.supplierPayment;

  const newAllocated = Number(payment.allocatedAmount) - Number(allocation.allocatedAmount);
  const newUnallocated = Number(payment.unallocatedAmount) + Number(allocation.allocatedAmount);

  let newStatus = payment.status;
  if (newAllocated <= 0) {
    newStatus = SupplierPaymentStatus.POSTED;
  } else {
    newStatus = SupplierPaymentStatus.PARTIALLY_ALLOCATED;
  }

  await prisma.$transaction([
    prisma.supplierPaymentAllocation.delete({ where: { id: allocationId } }),
    prisma.supplierPayment.update({
      where: { id: payment.id },
      data: {
        allocatedAmount: newAllocated,
        unallocatedAmount: newUnallocated,
        status: newStatus
      }
    })
  ]);

  await logAudit({
    module: "PROCUREMENT",
    entityType: "SupplierPayment",
    entityId: payment.id,
    action: "REMOVE_ALLOCATION",
    description: `Removed allocation of ${allocation.allocatedAmount}`
  });
}

export async function cancelPayment(companyId: string, userId: string, id: string, reason: string) {
  const payment = await validatePayment(companyId, id, ["DRAFT", "POSTED", "PARTIALLY_ALLOCATED", "FULLY_ALLOCATED"]);

  // If there are allocations, they must be removed first or we delete them transactionally
  await prisma.supplierPaymentAllocation.deleteMany({ where: { supplierPaymentId: id } });

  // Reverse ledger entry here by posting a reversal journal
  // (In a real scenario, this would be an explicit reversal entry via PostingEngine)

  const updated = await prisma.supplierPayment.update({
    where: { id },
    data: { 
      status: SupplierPaymentStatus.CANCELLED,
      allocatedAmount: 0,
      unallocatedAmount: 0,
      remarks: payment.remarks ? `${payment.remarks}\nCancel Reason: ${reason}` : `Cancel Reason: ${reason}`
    }
  });

  await logAudit({
    module: "PROCUREMENT",
    entityType: "SupplierPayment",
    entityId: id,
    action: "CANCEL",
    description: `Cancelled Supplier Payment ${payment.paymentNumber}. Reason: ${reason}`
  });

  return updated;
}

export async function calculateOutstanding(companyId: string, invoiceId: string): Promise<number> {
  const invoice = await prisma.supplierInvoice.findUnique({
    where: { id: invoiceId, companyId }
  });

  if (!invoice) return 0;

  const allocations = await prisma.supplierPaymentAllocation.aggregate({
    where: { supplierInvoiceId: invoiceId },
    _sum: { allocatedAmount: true }
  });

  const totalAllocated = Number(allocations._sum.allocatedAmount || 0);
  return Number(invoice.totalAmount) - totalAllocated;
}

export async function calculateSupplierBalance(companyId: string, supplierId: string): Promise<number> {
  // Outstanding liability = Total Posted Invoices - Total Posted/Allocated Payments
  
  const invoices = await prisma.supplierInvoice.aggregate({
    where: { companyId, supplierId, status: "POSTED" },
    _sum: { totalAmount: true }
  });

  const payments = await prisma.supplierPayment.aggregate({
    where: { 
      companyId, 
      supplierId, 
      status: { in: ["POSTED", "PARTIALLY_ALLOCATED", "FULLY_ALLOCATED"] } 
    },
    _sum: { amount: true }
  });

  return Number(invoices._sum.totalAmount || 0) - Number(payments._sum.amount || 0);
}

export async function generatePaymentNumber(companyId: string): Promise<string> {
  const count = await prisma.supplierPayment.count({ where: { companyId } });
  return `PAY-${(count + 1).toString().padStart(5, '0')}`;
}

export async function validatePayment(companyId: string, id: string, allowedStatuses: SupplierPaymentStatus[]) {
  const payment = await prisma.supplierPayment.findUnique({ where: { id, companyId } });
  if (!payment) throw new Error("Supplier Payment not found.");
  if (!allowedStatuses.includes(payment.status)) {
    throw new Error(`Invalid status transition. Current status: ${payment.status}. Required: ${allowedStatuses.join(", ")}`);
  }
  return payment;
}

async function createPosting(companyId: string, payment: any, userId: string) {
  // Debit: Accounts Payable (Reduces Liability)
  // Credit: Cash/Bank Account (Reduces Asset)
  
  const entries = [
    { accountCode: "AP-PAYABLES", debit: Number(payment.amount), credit: 0 },
    { accountCode: payment.paymentMethod === "CASH" ? "CASH-MAIN" : "BANK-MAIN", debit: 0, credit: Number(payment.amount) }
  ];

  await postJournalEntry(companyId, {
    date: new Date(payment.paymentDate),
    reference: `Supplier Payment: ${payment.paymentNumber}`,
    description: `Payment to Supplier ${payment.supplierId}`,
    lines: entries,
    sourceModule: "PROCUREMENT",
    sourceId: payment.id,
    createdById: userId
  });
}

export async function getPaymentHistory(companyId: string, id: string) {
  return prisma.globalAuditLog.findMany({
    where: { companyId, entityType: "SupplierPayment", entityId: id },
    orderBy: { createdAt: 'desc' }
  });
}
