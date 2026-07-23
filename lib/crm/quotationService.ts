import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { QuotationStatus, Prisma } from "@prisma/client";

/**
 * Validates a quotation.
 */
export async function validateQuotation(
  companyId: string,
  data: { customerId: string; opportunityId?: string; expiryDate: Date; lines: any[] }
) {
  const customer = await prisma.customer.findFirst({ where: { id: data.customerId, companyId } });
  if (!customer) throw new Error("Customer not found or does not belong to company");

  if (data.opportunityId) {
    const opportunity = await prisma.opportunity.findFirst({ where: { id: data.opportunityId, companyId } });
    if (!opportunity) throw new Error("Opportunity not found or does not belong to company");
  }

  if (new Date(data.expiryDate) < new Date()) {
    throw new Error("Expiry date cannot be in the past");
  }

  if (!data.lines || data.lines.length === 0) {
    throw new Error("Quotation must have at least one line item");
  }

  for (const line of data.lines) {
    const product = await prisma.product.findFirst({ where: { id: line.productId, companyId } });
    if (!product) throw new Error(`Product ${line.productId} not found`);

    if (line.warehouseId) {
      const warehouse = await prisma.warehouse.findFirst({ where: { id: line.warehouseId, companyId } });
      if (!warehouse) throw new Error(`Warehouse ${line.warehouseId} not found`);
    }
  }

  return { valid: true };
}

/**
 * Generates a unique quotation number.
 */
export async function generateQuotationNumber(companyId: string): Promise<string> {
  const count = await prisma.quotation.count({
    where: { companyId }
  });
  
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const nextNumber = (count + 1).toString().padStart(4, "0");
  
  return `QT-${dateStr}-${nextNumber}`;
}

/**
 * Calculates totals for a quotation.
 */
export function calculateTotals(lines: any[], globalDiscount: number = 0, globalShipping: number = 0) {
  let subtotal = 0;
  let taxAmount = 0;

  const processedLines = lines.map(line => {
    const qty = Number(line.quantity);
    const price = Number(line.unitPrice);
    const discPct = Number(line.discountPercent || 0);
    const taxPct = Number(line.taxPercent || 0);

    const grossLineTotal = qty * price;
    const discountAmt = grossLineTotal * (discPct / 100);
    const lineSubtotal = grossLineTotal - discountAmt;
    const lineTaxAmt = lineSubtotal * (taxPct / 100);
    const lineTotal = lineSubtotal + lineTaxAmt;

    subtotal += lineSubtotal;
    taxAmount += lineTaxAmt;

    return {
      ...line,
      discountAmount: discountAmt,
      taxAmount: lineTaxAmt,
      lineTotal
    };
  });

  const totalAmount = subtotal + taxAmount + globalShipping - globalDiscount;

  return {
    subtotal,
    taxAmount,
    shippingAmount: globalShipping,
    discountAmount: globalDiscount,
    totalAmount,
    processedLines
  };
}

/**
 * Creates a new quotation.
 */
export async function createQuotation(companyId: string, userId: string, data: any) {
  if (!data.quotationNumber) {
    data.quotationNumber = await generateQuotationNumber(companyId);
  }

  await validateQuotation(companyId, data);

  const { subtotal, taxAmount, shippingAmount, discountAmount, totalAmount, processedLines } = calculateTotals(
    data.lines, 
    Number(data.discountAmount || 0), 
    Number(data.shippingAmount || 0)
  );

  const quotation = await prisma.quotation.create({
    data: {
      companyId,
      quotationNumber: data.quotationNumber,
      customerId: data.customerId,
      opportunityId: data.opportunityId,
      quotationDate: data.quotationDate || new Date(),
      expiryDate: data.expiryDate,
      currency: data.currency || "BDT",
      priceLevel: data.priceLevel,
      subtotal,
      taxAmount,
      shippingAmount,
      discountAmount,
      totalAmount,
      remarks: data.remarks,
      createdById: userId,
      lines: {
        create: processedLines.map(line => ({
          productId: line.productId,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent || 0,
          discountAmount: line.discountAmount,
          taxPercent: line.taxPercent || 0,
          taxAmount: line.taxAmount,
          lineTotal: line.lineTotal,
          warehouseId: line.warehouseId,
          remarks: line.remarks
        }))
      }
    },
    include: { lines: true }
  });

  await logAudit({
    module: "CRM",
    entityType: "Quotation",
    entityId: quotation.id,
    action: "CREATE",
    description: `Created quotation ${quotation.quotationNumber}`,
    afterValue: quotation,
  });

  return quotation;
}

/**
 * Updates an existing quotation.
 */
export async function updateQuotation(companyId: string, id: string, userId: string, data: any) {
  const existing = await prisma.quotation.findUnique({
    where: { id },
    include: { lines: true }
  });
  
  if (!existing || existing.companyId !== companyId) throw new Error("Quotation not found");
  if (existing.status !== QuotationStatus.DRAFT && existing.status !== QuotationStatus.PENDING_APPROVAL) {
    throw new Error("Cannot modify a quotation that has been processed");
  }

  await validateQuotation(companyId, data);

  const { subtotal, taxAmount, shippingAmount, discountAmount, totalAmount, processedLines } = calculateTotals(
    data.lines, 
    Number(data.discountAmount || existing.discountAmount), 
    Number(data.shippingAmount || existing.shippingAmount)
  );

  const quotation = await prisma.$transaction(async (tx) => {
    // Delete old lines
    await tx.quotationLine.deleteMany({ where: { quotationId: id } });

    // Update quote and create new lines
    return await tx.quotation.update({
      where: { id },
      data: {
        customerId: data.customerId,
        opportunityId: data.opportunityId,
        expiryDate: data.expiryDate,
        currency: data.currency,
        priceLevel: data.priceLevel,
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        totalAmount,
        remarks: data.remarks,
        lines: {
          create: processedLines.map(line => ({
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPercent: line.discountPercent || 0,
            discountAmount: line.discountAmount,
            taxPercent: line.taxPercent || 0,
            taxAmount: line.taxAmount,
            lineTotal: line.lineTotal,
            warehouseId: line.warehouseId,
            remarks: line.remarks
          }))
        }
      },
      include: { lines: true }
    });
  });

  await logAudit({
    module: "CRM",
    entityType: "Quotation",
    entityId: quotation.id,
    action: "UPDATE",
    description: `Updated quotation ${quotation.quotationNumber}`,
    beforeValue: existing,
    afterValue: quotation,
  });

  return quotation;
}

/**
 * Deletes a draft quotation.
 */
export async function deleteQuotation(companyId: string, id: string) {
  const existing = await prisma.quotation.findFirst({
    where: { id, companyId }
  });

  if (!existing) throw new Error("Quotation not found");
  if (existing.status !== QuotationStatus.DRAFT) throw new Error("Only DRAFT quotations can be deleted");

  await prisma.quotation.delete({
    where: { id }
  });

  await logAudit({
    module: "CRM",
    entityType: "Quotation",
    entityId: id,
    action: "DELETE",
    description: `Deleted quotation ${existing.quotationNumber}`,
    beforeValue: existing,
  });

  return true;
}

/**
 * Approves a quotation.
 */
export async function approveQuotation(companyId: string, id: string, userId: string) {
  const quotation = await prisma.quotation.update({
    where: { id, companyId },
    data: { 
      status: QuotationStatus.APPROVED,
      approvedById: userId,
      approvedAt: new Date()
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "Quotation",
    entityId: id,
    action: "UPDATE",
    description: `Approved quotation ${quotation.quotationNumber}`,
  });

  return quotation;
}

/**
 * Marks a quotation as sent.
 */
export async function sendQuotation(companyId: string, id: string, userId: string) {
  const quotation = await prisma.quotation.update({
    where: { id, companyId },
    data: { status: QuotationStatus.SENT }
  });

  await logAudit({
    module: "CRM",
    entityType: "Quotation",
    entityId: id,
    action: "UPDATE",
    description: `Sent quotation ${quotation.quotationNumber}`,
  });

  return quotation;
}

/**
 * Marks a quotation as accepted by customer.
 */
export async function acceptQuotation(companyId: string, id: string, userId: string) {
  const quotation = await prisma.quotation.update({
    where: { id, companyId },
    data: { status: QuotationStatus.ACCEPTED }
  });

  await logAudit({
    module: "CRM",
    entityType: "Quotation",
    entityId: id,
    action: "UPDATE",
    description: `Accepted quotation ${quotation.quotationNumber}`,
  });

  return quotation;
}

/**
 * Marks a quotation as rejected.
 */
export async function rejectQuotation(companyId: string, id: string, userId: string) {
  const quotation = await prisma.quotation.update({
    where: { id, companyId },
    data: { status: QuotationStatus.REJECTED }
  });

  await logAudit({
    module: "CRM",
    entityType: "Quotation",
    entityId: id,
    action: "UPDATE",
    description: `Rejected quotation ${quotation.quotationNumber}`,
  });

  return quotation;
}

/**
 * Expires a quotation.
 */
export async function expireQuotation(companyId: string, id: string, userId: string) {
  const quotation = await prisma.quotation.update({
    where: { id, companyId },
    data: { status: QuotationStatus.EXPIRED }
  });

  await logAudit({
    module: "CRM",
    entityType: "Quotation",
    entityId: id,
    action: "UPDATE",
    description: `Expired quotation ${quotation.quotationNumber}`,
  });

  return quotation;
}

/**
 * Converts an ACCEPTED quotation to a Sales Order. (Prepares status shift, actual generation in Phase 3E).
 */
export async function convertToSalesOrder(companyId: string, id: string, userId: string) {
  const existing = await prisma.quotation.findFirst({ where: { id, companyId } });
  if (!existing || existing.status !== QuotationStatus.ACCEPTED) {
    throw new Error("Only ACCEPTED quotations can be converted");
  }

  const quotation = await prisma.quotation.update({
    where: { id },
    data: { status: QuotationStatus.CONVERTED }
  });

  await logAudit({
    module: "CRM",
    entityType: "Quotation",
    entityId: id,
    action: "UPDATE",
    description: `Converted quotation ${quotation.quotationNumber} to Sales Order (Phase 3E Pending)`,
  });

  return quotation;
}

/**
 * Duplicates a quotation.
 */
export async function duplicateQuotation(companyId: string, id: string, userId: string) {
  const existing = await prisma.quotation.findFirst({
    where: { id, companyId },
    include: { lines: true }
  });

  if (!existing) throw new Error("Quotation not found");

  const newNumber = await generateQuotationNumber(companyId);

  const duplicate = await prisma.quotation.create({
    data: {
      companyId,
      quotationNumber: newNumber,
      customerId: existing.customerId,
      opportunityId: existing.opportunityId,
      quotationDate: new Date(),
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Add 30 days
      currency: existing.currency,
      priceLevel: existing.priceLevel,
      subtotal: existing.subtotal,
      taxAmount: existing.taxAmount,
      shippingAmount: existing.shippingAmount,
      discountAmount: existing.discountAmount,
      totalAmount: existing.totalAmount,
      remarks: existing.remarks,
      createdById: userId,
      lines: {
        create: existing.lines.map(line => ({
          productId: line.productId,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          discountAmount: line.discountAmount,
          taxPercent: line.taxPercent,
          taxAmount: line.taxAmount,
          lineTotal: line.lineTotal,
          warehouseId: line.warehouseId,
          remarks: line.remarks
        }))
      }
    },
    include: { lines: true }
  });

  await logAudit({
    module: "CRM",
    entityType: "Quotation",
    entityId: duplicate.id,
    action: "CREATE",
    description: `Duplicated quotation ${existing.quotationNumber} to ${duplicate.quotationNumber}`,
    afterValue: duplicate,
  });

  return duplicate;
}

/**
 * Retrieves audit history for a specific quotation.
 */
export async function getQuotationHistory(companyId: string, id: string) {
  return await prisma.globalAuditLog.findMany({
    where: {
      companyId,
      module: "CRM",
      entityType: "Quotation",
      entityId: id,
    },
    orderBy: { createdAt: 'desc' }
  });
}
