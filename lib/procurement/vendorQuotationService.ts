import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { VendorQuotationStatus } from "@prisma/client";

/**
 * Enterprise Vendor Quotation Service (Version 1.4)
 */

export async function createVendorQuotation(companyId: string, userId: string, supplierId: string, rfqId: string | null, data: any) {
  // Validate Supplier
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId, companyId } });
  if (!supplier || supplier.status === "BLOCKED" || supplier.status === "BLACKLISTED") {
    throw new Error("Cannot create quotation: Supplier is invalid or blocked.");
  }

  // Validate RFQ if linked
  if (rfqId) {
    const rfq = await prisma.requestForQuotation.findUnique({ where: { id: rfqId, companyId } });
    if (!rfq || rfq.status === "CLOSED" || rfq.status === "CANCELLED") {
      throw new Error("Cannot attach quotation to a closed or cancelled RFQ.");
    }
  }

  const vq = await prisma.vendorQuotation.create({
    data: {
      companyId,
      supplierId,
      requestForQuotationId: rfqId,
      status: VendorQuotationStatus.DRAFT,
      currency: data.currency || "USD",
      quotationDate: data.quotationDate ? new Date(data.quotationDate) : new Date(),
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      leadTime: data.leadTime,
      paymentTerms: data.paymentTerms,
      remarks: data.remarks,
      subtotal: data.subtotal || 0,
      discount: data.discount || 0,
      tax: data.tax || 0,
      shipping: data.shipping || 0,
      total: data.total || 0,
      lines: {
        create: data.lines.map((line: any) => ({
          requestForQuotationLineId: line.requestForQuotationLineId,
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discount: line.discount || 0,
          tax: line.tax || 0,
          lineTotal: line.lineTotal || (Number(line.quantity) * Number(line.unitPrice) - Number(line.discount || 0) + Number(line.tax || 0))
        }))
      }
    },
    include: { lines: true }
  });

  await logAudit({
    companyId,
    userId,
    action: "CREATE",
    entityType: "VendorQuotation",
    entityId: vq.id,
    details: `Created Draft Vendor Quotation for supplier ${supplier.name}`
  });

  return vq;
}

export async function submitVendorQuotation(companyId: string, userId: string, id: string) {
  const existing = await validateVendorQuotation(companyId, id, ["DRAFT"]);

  const vq = await prisma.vendorQuotation.update({
    where: { id },
    data: { status: VendorQuotationStatus.SUBMITTED }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "VendorQuotation",
    entityId: id,
    details: `Submitted Vendor Quotation for review.`
  });

  return vq;
}

export async function acceptVendorQuotation(companyId: string, userId: string, id: string) {
  const existing = await validateVendorQuotation(companyId, id, ["SUBMITTED", "UNDER_REVIEW"]);

  // In an RFQ context, accepting one might imply rejecting others for the same RFQ line, 
  // but that logic is handled by the future Vendor Comparison Engine.
  const vq = await prisma.vendorQuotation.update({
    where: { id },
    data: { status: VendorQuotationStatus.ACCEPTED }
  });

  await logAudit({
    companyId,
    userId,
    action: "APPROVAL",
    entityType: "VendorQuotation",
    entityId: id,
    details: `Accepted Vendor Quotation. Ready for Purchase Order.`
  });

  return vq;
}

export async function rejectVendorQuotation(companyId: string, userId: string, id: string, reason: string) {
  const existing = await validateVendorQuotation(companyId, id, ["SUBMITTED", "UNDER_REVIEW"]);

  const vq = await prisma.vendorQuotation.update({
    where: { id },
    data: { 
      status: VendorQuotationStatus.REJECTED,
      remarks: existing.remarks ? `${existing.remarks}\nReject Reason: ${reason}` : `Reject Reason: ${reason}`
    }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "VendorQuotation",
    entityId: id,
    details: `Rejected Vendor Quotation. Reason: ${reason}`
  });

  return vq;
}

export async function validateVendorQuotation(companyId: string, id: string, allowedStatuses: VendorQuotationStatus[]) {
  const vq = await prisma.vendorQuotation.findUnique({ where: { id, companyId } });
  if (!vq) throw new Error("Vendor Quotation not found.");
  if (!allowedStatuses.includes(vq.status)) {
    throw new Error(`Invalid status transition. Current status: ${vq.status}. Required: ${allowedStatuses.join(", ")}`);
  }
  return vq;
}
