import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { VendorComparisonStatus, EvaluationMethod } from "@prisma/client";

/**
 * Enterprise Vendor Comparison Service (Version 1.4)
 */

export async function createComparison(companyId: string, userId: string, rfqId: string, data: any) {
  const comparisonNumber = data.comparisonNumber || await generateComparisonNumber(companyId);

  // Validate RFQ
  const rfq = await prisma.requestForQuotation.findUnique({
    where: { id: rfqId, companyId },
    include: { vendorQuotations: { where: { status: "SUBMITTED" } } }
  });

  if (!rfq) throw new Error("RFQ not found.");
  if (rfq.status !== "CLOSED") {
    throw new Error("Cannot compare vendors until the RFQ is CLOSED.");
  }

  const comparison = await prisma.vendorComparison.create({
    data: {
      companyId,
      comparisonNumber,
      requestForQuotationId: rfqId,
      status: VendorComparisonStatus.DRAFT,
      evaluationMethod: data.evaluationMethod || EvaluationMethod.MANUAL_SELECTION,
      remarks: data.remarks,
      createdById: userId,
      items: {
        create: data.items.map((item: any) => ({
          vendorQuotationId: item.vendorQuotationId,
          supplierId: item.supplierId,
          totalPrice: item.totalPrice,
          leadTime: item.leadTime,
          paymentTerms: item.paymentTerms,
          qualityScore: item.qualityScore,
          deliveryScore: item.deliveryScore,
          priceScore: item.priceScore,
          overallScore: item.overallScore,
          ranking: item.ranking,
          remarks: item.remarks
        }))
      }
    },
    include: { items: true }
  });

  await logAudit({
    companyId,
    userId,
    action: "CREATE",
    entity: "VendorComparison",
    entityId: comparison.id,
    details: `Created Vendor Comparison ${comparison.comparisonNumber} for RFQ ${rfq.rfqNumber}`
  });

  return comparison;
}

export async function loadVendorQuotations(companyId: string, rfqId: string) {
  return prisma.vendorQuotation.findMany({
    where: { companyId, requestForQuotationId: rfqId, status: "SUBMITTED" },
    include: { lines: true, supplier: true }
  });
}

export async function calculateScores(companyId: string, userId: string, id: string, method: EvaluationMethod) {
  const comparison = await validateComparison(companyId, id, ["DRAFT"]);

  // Fetch items to compute scores (dummy example algorithm for LOWEST_PRICE)
  const items = await prisma.vendorComparisonItem.findMany({ where: { vendorComparisonId: id } });

  if (method === "LOWEST_PRICE") {
    const sorted = items.sort((a, b) => Number(a.totalPrice) - Number(b.totalPrice));
    for (let i = 0; i < sorted.length; i++) {
      await prisma.vendorComparisonItem.update({
        where: { id: sorted[i].id },
        data: { ranking: i + 1, priceScore: 100 - (i * 10), overallScore: 100 - (i * 10) }
      });
    }
  }
  // Other methods (WEIGHTED_SCORE, BEST_VALUE) can inject specific formulas here

  await prisma.vendorComparison.update({
    where: { id },
    data: { evaluationMethod: method }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entity: "VendorComparison",
    entityId: id,
    details: `Calculated scores using ${method}`
  });
}

export async function selectSupplier(companyId: string, userId: string, id: string, supplierId: string, vendorQuotationId: string) {
  const comparison = await validateComparison(companyId, id, ["DRAFT", "UNDER_REVIEW"]);

  // Reset all selections first
  await prisma.vendorComparisonItem.updateMany({
    where: { vendorComparisonId: id },
    data: { isSelected: false }
  });

  // Select the winning item
  const selectedItem = await prisma.vendorComparisonItem.updateMany({
    where: { vendorComparisonId: id, supplierId, vendorQuotationId },
    data: { isSelected: true }
  });

  if (selectedItem.count === 0) {
    throw new Error("Specified supplier/quotation not found in this comparison.");
  }

  const updatedComparison = await prisma.vendorComparison.update({
    where: { id },
    data: { selectedSupplierId: supplierId }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entity: "VendorComparison",
    entityId: id,
    details: `Selected Supplier ${supplierId} for RFQ ${comparison.requestForQuotationId}`
  });

  return updatedComparison;
}

export async function approveComparison(companyId: string, userId: string, id: string) {
  const comparison = await validateComparison(companyId, id, ["DRAFT", "UNDER_REVIEW"]);

  if (!comparison.selectedSupplierId) {
    throw new Error("Cannot approve comparison without a selected supplier.");
  }

  const updated = await prisma.vendorComparison.update({
    where: { id },
    data: { 
      status: VendorComparisonStatus.APPROVED,
      approvedById: userId,
      approvedAt: new Date()
    }
  });

  await logAudit({
    companyId,
    userId,
    action: "APPROVAL",
    entity: "VendorComparison",
    entityId: id,
    details: `Approved Vendor Comparison ${comparison.comparisonNumber}`
  });

  return updated;
}

export async function rejectComparison(companyId: string, userId: string, id: string, reason: string) {
  const comparison = await validateComparison(companyId, id, ["DRAFT", "UNDER_REVIEW"]);

  const updated = await prisma.vendorComparison.update({
    where: { id },
    data: { 
      status: VendorComparisonStatus.REJECTED,
      remarks: comparison.remarks ? `${comparison.remarks}\nReject Reason: ${reason}` : `Reject Reason: ${reason}`
    }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entity: "VendorComparison",
    entityId: id,
    details: `Rejected Vendor Comparison. Reason: ${reason}`
  });

  return updated;
}

export async function convertToPurchaseOrder(companyId: string, userId: string, id: string) {
  const comparison = await validateComparison(companyId, id, ["APPROVED"]);

  const updated = await prisma.vendorComparison.update({
    where: { id },
    data: { status: VendorComparisonStatus.CONVERTED }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entity: "VendorComparison",
    entityId: id,
    details: `Converted Vendor Comparison ${comparison.comparisonNumber} to Purchase Order`
  });

  return updated;
}

export async function generateComparisonNumber(companyId: string): Promise<string> {
  const count = await prisma.vendorComparison.count({ where: { companyId } });
  return `VCOMP-${(count + 1).toString().padStart(5, '0')}`;
}

export async function validateComparison(companyId: string, id: string, allowedStatuses: VendorComparisonStatus[]) {
  const comparison = await prisma.vendorComparison.findUnique({ where: { id, companyId } });
  if (!comparison) throw new Error("Vendor Comparison not found.");
  if (!allowedStatuses.includes(comparison.status)) {
    throw new Error(`Invalid status transition. Current status: ${comparison.status}. Required: ${allowedStatuses.join(", ")}`);
  }
  return comparison;
}

export async function getComparisonHistory(companyId: string, id: string) {
  return prisma.globalAuditLog.findMany({
    where: { companyId, entity: "VendorComparison", entityId: id },
    orderBy: { timestamp: 'desc' }
  });
}
