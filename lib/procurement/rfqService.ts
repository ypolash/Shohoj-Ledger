import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { RequestForQuotationStatus } from "@prisma/client";

/**
 * Enterprise Request For Quotation (RFQ) Service (Version 1.4)
 */

export async function createRFQ(companyId: string, userId: string, purchaseRequisitionId: string | null, data: any) {
  const rfqNumber = data.rfqNumber || await generateRFQNumber(companyId);

  // If linked to a PR, ensure PR is approved
  if (purchaseRequisitionId) {
    const pr = await prisma.purchaseRequisition.findUnique({ where: { id: purchaseRequisitionId, companyId } });
    if (!pr || (pr.status !== "APPROVED" && pr.status !== "CONVERTED")) {
      throw new Error("Cannot create RFQ: Linked Purchase Requisition must be APPROVED.");
    }
  }

  const rfq = await prisma.requestForQuotation.create({
    data: {
      companyId,
      rfqNumber,
      purchaseRequisitionId,
      createdById: userId,
      status: RequestForQuotationStatus.DRAFT,
      remarks: data.remarks,
      closingDate: data.closingDate ? new Date(data.closingDate) : null,
      lines: {
        create: data.lines.map((line: any) => ({
          purchaseRequisitionLineId: line.purchaseRequisitionLineId,
          productId: line.productId,
          description: line.description,
          quantity: line.quantity,
          uom: line.uom,
          remarks: line.remarks
        }))
      }
    },
    include: { lines: true }
  });

  await logAudit({
    companyId,
    userId,
    action: "CREATE",
    entityType: "RequestForQuotation",
    entityId: rfq.id,
    details: `Created RFQ ${rfq.rfqNumber}`
  });

  return rfq;
}

export async function issueRFQ(companyId: string, userId: string, id: string) {
  const existing = await validateRFQ(companyId, id, ["DRAFT"]);

  const rfq = await prisma.requestForQuotation.update({
    where: { id },
    data: { 
      status: RequestForQuotationStatus.ISSUED,
      issueDate: new Date()
    }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "RequestForQuotation",
    entityId: id,
    details: `Issued RFQ ${existing.rfqNumber} to vendors.`
  });

  return rfq;
}

export async function closeRFQ(companyId: string, userId: string, id: string) {
  const existing = await validateRFQ(companyId, id, ["ISSUED"]);

  const rfq = await prisma.requestForQuotation.update({
    where: { id },
    data: { status: RequestForQuotationStatus.CLOSED }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "RequestForQuotation",
    entityId: id,
    details: `Closed RFQ ${existing.rfqNumber}. No longer accepting quotes.`
  });

  return rfq;
}

export async function cancelRFQ(companyId: string, userId: string, id: string, reason: string) {
  const existing = await validateRFQ(companyId, id, ["DRAFT", "ISSUED", "CLOSED"]);

  const rfq = await prisma.requestForQuotation.update({
    where: { id },
    data: { 
      status: RequestForQuotationStatus.CANCELLED,
      remarks: existing.remarks ? `${existing.remarks}\nCancel Reason: ${reason}` : `Cancel Reason: ${reason}`
    }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "RequestForQuotation",
    entityId: id,
    details: `Cancelled RFQ ${existing.rfqNumber}. Reason: ${reason}`
  });

  return rfq;
}

export async function generateRFQNumber(companyId: string): Promise<string> {
  const count = await prisma.requestForQuotation.count({ where: { companyId } });
  return `RFQ-${(count + 1).toString().padStart(5, '0')}`;
}

export async function validateRFQ(companyId: string, id: string, allowedStatuses: RequestForQuotationStatus[]) {
  const rfq = await prisma.requestForQuotation.findUnique({ where: { id, companyId } });
  if (!rfq) throw new Error("RFQ not found.");
  if (!allowedStatuses.includes(rfq.status)) {
    throw new Error(`Invalid status transition. Current status: ${rfq.status}. Required: ${allowedStatuses.join(", ")}`);
  }
  return rfq;
}

export async function getRFQHistory(companyId: string, id: string) {
  return prisma.globalAuditLog.findMany({
    where: { companyId, entityType: "RequestForQuotation", entityId: id },
    orderBy: { createdAt: 'desc' }
  });
}
