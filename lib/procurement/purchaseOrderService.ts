import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { PurchaseOrderStatus } from "@prisma/client";

/**
 * Enterprise Purchase Order Engine (Version 1.4)
 * 
 * PO represents a commercial commitment to a supplier.
 * It DOES NOT update inventory.
 * It DOES NOT post accounting ledgers.
 */

export async function createPurchaseOrder(companyId: string, userId: string, supplierId: string, data: any) {
  const purchaseOrderNumber = data.purchaseOrderNumber || await generatePurchaseOrderNumber(companyId);

  const po = await prisma.purchaseOrder.create({
    data: {
      companyId,
      purchaseOrderNumber,
      supplierId,
      vendorComparisonId: data.vendorComparisonId,
      status: PurchaseOrderStatus.DRAFT,
      orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
      currency: data.currency || "USD",
      paymentTerms: data.paymentTerms,
      remarks: data.remarks,
      createdById: userId,
      lines: {
        create: data.lines.map((line: any) => ({
          productId: line.productId,
          warehouseId: line.warehouseId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent || 0,
          discountAmount: line.discountAmount || 0,
          taxPercent: line.taxPercent || 0,
          taxAmount: line.taxAmount || 0,
          lineTotal: line.lineTotal || (Number(line.quantity) * Number(line.unitPrice) - Number(line.discountAmount || 0) + Number(line.taxAmount || 0)),
          remarks: line.remarks
        }))
      }
    },
    include: { lines: true }
  });

  const totals = calculateTotals(po.lines);
  
  const updatedPo = await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: {
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      shippingAmount: data.shippingAmount || 0,
      totalAmount: totals.subtotal - totals.discountAmount + totals.taxAmount + (data.shippingAmount || 0)
    },
    include: { lines: true }
  });

  await logAudit({
    companyId,
    userId,
    action: "CREATE",
    entity: "PurchaseOrder",
    entityId: po.id,
    details: `Created Purchase Order ${po.purchaseOrderNumber}`
  });

  return updatedPo;
}

export async function updatePurchaseOrder(companyId: string, userId: string, id: string, data: any) {
  const existing = await validatePurchaseOrder(companyId, id, ["DRAFT", "PENDING_APPROVAL"]);

  // We wipe and replace lines in draft/pending mode for simplicity
  await prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : existing.expectedDeliveryDate,
      paymentTerms: data.paymentTerms,
      remarks: data.remarks,
      lines: {
        create: data.lines.map((line: any) => ({
          productId: line.productId,
          warehouseId: line.warehouseId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent || 0,
          discountAmount: line.discountAmount || 0,
          taxPercent: line.taxPercent || 0,
          taxAmount: line.taxAmount || 0,
          lineTotal: line.lineTotal || (Number(line.quantity) * Number(line.unitPrice) - Number(line.discountAmount || 0) + Number(line.taxAmount || 0)),
          remarks: line.remarks
        }))
      }
    },
    include: { lines: true }
  });

  const totals = calculateTotals(po.lines);

  const updatedPo = await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: {
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      shippingAmount: data.shippingAmount ?? existing.shippingAmount,
      totalAmount: totals.subtotal - totals.discountAmount + totals.taxAmount + Number(data.shippingAmount ?? existing.shippingAmount)
    },
    include: { lines: true }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entity: "PurchaseOrder",
    entityId: id,
    details: `Updated Purchase Order ${existing.purchaseOrderNumber}`
  });

  return updatedPo;
}

export async function convertVendorComparison(companyId: string, userId: string, vendorComparisonId: string) {
  const comparison = await prisma.vendorComparison.findUnique({
    where: { id: vendorComparisonId, companyId },
    include: { items: { where: { isSelected: true }, include: { vendorQuotation: { include: { lines: true } } } } }
  });

  if (!comparison) throw new Error("Vendor Comparison not found.");
  if (comparison.status !== "APPROVED") throw new Error("Cannot convert unapproved Vendor Comparison.");
  if (!comparison.selectedSupplierId || comparison.items.length === 0) {
    throw new Error("No winning supplier selected in this comparison.");
  }

  const winningQuote = comparison.items[0].vendorQuotation;
  
  const po = await createPurchaseOrder(companyId, userId, comparison.selectedSupplierId, {
    vendorComparisonId,
    currency: winningQuote.currency,
    paymentTerms: winningQuote.paymentTerms,
    shippingAmount: winningQuote.shipping,
    lines: winningQuote.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountAmount: line.discount,
      taxAmount: line.tax,
      lineTotal: line.lineTotal
    }))
  });

  // Mark comparison as converted
  await prisma.vendorComparison.update({
    where: { id: vendorComparisonId },
    data: { status: "CONVERTED" }
  });

  return po;
}

export async function approvePurchaseOrder(companyId: string, userId: string, id: string) {
  const existing = await validatePurchaseOrder(companyId, id, ["DRAFT", "PENDING_APPROVAL"]);

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: { 
      status: PurchaseOrderStatus.APPROVED,
      approvedById: userId,
      approvedAt: new Date()
    }
  });

  await logAudit({
    companyId,
    userId,
    action: "APPROVAL",
    entity: "PurchaseOrder",
    entityId: id,
    details: `Approved Purchase Order ${existing.purchaseOrderNumber}`
  });

  return po;
}

export async function cancelPurchaseOrder(companyId: string, userId: string, id: string, reason: string) {
  const existing = await validatePurchaseOrder(companyId, id, ["DRAFT", "PENDING_APPROVAL", "APPROVED", "OPEN"]);

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: { 
      status: PurchaseOrderStatus.CANCELLED,
      remarks: existing.remarks ? `${existing.remarks}\nCancel Reason: ${reason}` : `Cancel Reason: ${reason}`
    }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entity: "PurchaseOrder",
    entityId: id,
    details: `Cancelled Purchase Order ${existing.purchaseOrderNumber}. Reason: ${reason}`
  });

  return po;
}

export async function closePurchaseOrder(companyId: string, userId: string, id: string) {
  const existing = await validatePurchaseOrder(companyId, id, ["OPEN", "PARTIALLY_RECEIVED", "RECEIVED"]);

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: PurchaseOrderStatus.CLOSED }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entity: "PurchaseOrder",
    entityId: id,
    details: `Closed Purchase Order ${existing.purchaseOrderNumber}`
  });

  return po;
}

export async function generatePurchaseOrderNumber(companyId: string): Promise<string> {
  const count = await prisma.purchaseOrder.count({ where: { companyId } });
  return `PO-${(count + 1).toString().padStart(5, '0')}`;
}

export function calculateTotals(lines: any[]) {
  return lines.reduce(
    (acc, line) => {
      acc.subtotal += Number(line.quantity) * Number(line.unitPrice);
      acc.discountAmount += Number(line.discountAmount);
      acc.taxAmount += Number(line.taxAmount);
      return acc;
    },
    { subtotal: 0, discountAmount: 0, taxAmount: 0 }
  );
}

export async function validatePurchaseOrder(companyId: string, id: string, allowedStatuses: PurchaseOrderStatus[]) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id, companyId } });
  if (!po) throw new Error("Purchase Order not found.");
  if (!allowedStatuses.includes(po.status)) {
    throw new Error(`Invalid status transition. Current status: ${po.status}. Required: ${allowedStatuses.join(", ")}`);
  }
  return po;
}

export async function getPurchaseOrderHistory(companyId: string, id: string) {
  return prisma.globalAuditLog.findMany({
    where: { companyId, entity: "PurchaseOrder", entityId: id },
    orderBy: { timestamp: 'desc' }
  });
}
