import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { PurchaseRequisitionStatus, PurchaseRequisitionPriority } from "@prisma/client";

/**
 * Enterprise Purchase Requisition Service (Version 1.4)
 */

export async function createRequisition(companyId: string, userId: string, data: any) {
  const requisitionNumber = data.requisitionNumber || await generateRequisitionNumber(companyId);

  const requisition = await prisma.purchaseRequisition.create({
    data: {
      companyId,
      requisitionNumber,
      requestedById: userId,
      departmentId: data.departmentId,
      status: PurchaseRequisitionStatus.DRAFT,
      priority: data.priority || PurchaseRequisitionPriority.MEDIUM,
      requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
      remarks: data.remarks,
      lines: {
        create: data.lines.map((line: any) => ({
          productId: line.productId,
          description: line.description,
          quantity: line.quantity,
          uom: line.uom,
          estimatedCost: line.estimatedCost,
          warehouseId: line.warehouseId,
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
    entityType: "PurchaseRequisition",
    entityId: requisition.id,
    details: `Created Purchase Requisition ${requisition.requisitionNumber}`
  });

  return requisition;
}

export async function updateRequisition(companyId: string, userId: string, id: string, data: any) {
  const existing = await validateRequisition(companyId, id, ["DRAFT"]);

  // For simplicity, we delete existing lines and recreate them, typical in draft mode
  await prisma.purchaseRequisitionLine.deleteMany({ where: { purchaseRequisitionId: id } });

  const requisition = await prisma.purchaseRequisition.update({
    where: { id },
    data: {
      departmentId: data.departmentId,
      priority: data.priority,
      requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
      remarks: data.remarks,
      lines: {
        create: data.lines.map((line: any) => ({
          productId: line.productId,
          description: line.description,
          quantity: line.quantity,
          uom: line.uom,
          estimatedCost: line.estimatedCost,
          warehouseId: line.warehouseId,
          remarks: line.remarks
        }))
      }
    },
    include: { lines: true }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "PurchaseRequisition",
    entityId: id,
    details: `Updated Purchase Requisition ${existing.requisitionNumber}`
  });

  return requisition;
}

export async function submitRequisition(companyId: string, userId: string, id: string) {
  const existing = await validateRequisition(companyId, id, ["DRAFT", "REJECTED"]);

  const requisition = await prisma.purchaseRequisition.update({
    where: { id },
    data: { status: PurchaseRequisitionStatus.SUBMITTED }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "PurchaseRequisition",
    entityId: id,
    details: `Submitted Purchase Requisition ${existing.requisitionNumber} for approval`
  });

  return requisition;
}

export async function approveRequisition(companyId: string, userId: string, id: string) {
  const existing = await validateRequisition(companyId, id, ["SUBMITTED", "UNDER_REVIEW"]);

  const requisition = await prisma.purchaseRequisition.update({
    where: { id },
    data: { 
      status: PurchaseRequisitionStatus.APPROVED,
      approvedById: userId,
      approvedAt: new Date()
    }
  });

  await logAudit({
    companyId,
    userId,
    action: "APPROVAL",
    entityType: "PurchaseRequisition",
    entityId: id,
    details: `Approved Purchase Requisition ${existing.requisitionNumber}`
  });

  return requisition;
}

export async function rejectRequisition(companyId: string, userId: string, id: string, reason: string) {
  const existing = await validateRequisition(companyId, id, ["SUBMITTED", "UNDER_REVIEW"]);

  const requisition = await prisma.purchaseRequisition.update({
    where: { id },
    data: { 
      status: PurchaseRequisitionStatus.REJECTED,
      remarks: existing.remarks ? `${existing.remarks}\nReject Reason: ${reason}` : `Reject Reason: ${reason}`
    }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "PurchaseRequisition",
    entityId: id,
    details: `Rejected Purchase Requisition ${existing.requisitionNumber}. Reason: ${reason}`
  });

  return requisition;
}

export async function cancelRequisition(companyId: string, userId: string, id: string, reason: string) {
  const existing = await validateRequisition(companyId, id, ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED"]);

  const requisition = await prisma.purchaseRequisition.update({
    where: { id },
    data: { 
      status: PurchaseRequisitionStatus.CANCELLED,
      remarks: existing.remarks ? `${existing.remarks}\nCancel Reason: ${reason}` : `Cancel Reason: ${reason}`
    }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "PurchaseRequisition",
    entityId: id,
    details: `Cancelled Purchase Requisition ${existing.requisitionNumber}. Reason: ${reason}`
  });

  return requisition;
}

export async function convertToRFQ(companyId: string, userId: string, id: string) {
  const existing = await validateRequisition(companyId, id, ["APPROVED"]);

  const requisition = await prisma.purchaseRequisition.update({
    where: { id },
    data: { status: PurchaseRequisitionStatus.CONVERTED }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "PurchaseRequisition",
    entityId: id,
    details: `Converted Purchase Requisition ${existing.requisitionNumber} to RFQ`
  });

  return requisition;
}

export async function generateRequisitionNumber(companyId: string): Promise<string> {
  const count = await prisma.purchaseRequisition.count({ where: { companyId } });
  return `PR-${(count + 1).toString().padStart(5, '0')}`;
}

export async function validateRequisition(companyId: string, id: string, allowedStatuses: PurchaseRequisitionStatus[]) {
  const req = await prisma.purchaseRequisition.findUnique({ where: { id, companyId } });
  if (!req) throw new Error("Purchase Requisition not found.");
  if (!allowedStatuses.includes(req.status)) {
    throw new Error(`Invalid status transition. Current status: ${req.status}. Required: ${allowedStatuses.join(", ")}`);
  }
  return req;
}

export async function getRequisitionHistory(companyId: string, id: string) {
  return prisma.globalAuditLog.findMany({
    where: { companyId, entityType: "PurchaseRequisition", entityId: id },
    orderBy: { createdAt: 'desc' }
  });
}
