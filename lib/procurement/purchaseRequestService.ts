import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Version 1.3 Phase 2N: Purchase Request Workflow
 * Manages procurement requests prior to PO conversion.
 */

export const purchaseRequestService = {

  generateRequestNumber: async (companyId: string) => {
    const count = await prisma.purchaseRequisition.count({ where: { companyId } });
    return `PR-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  },

  validateRequest: async (companyId: string, requestId: string) => {
    const request = await prisma.purchaseRequisition.findFirst({
      where: { id: requestId, companyId },
      include: { lines: true }
    });
    if (!request) throw new Error("Purchase Request not found.");
    return request;
  },

  createRequest: async (data: {
    companyId: string;
    warehouseId?: string;
    departmentId?: string;
    requestedById?: string;
    remarks?: string;
    lines: {
      productId?: string;
      description?: string;
      quantity?: number | Decimal;
      uom?: string;
      estimatedCost?: number | Decimal;
      warehouseId?: string;
      remarks?: string;
    }[];
  }) => {
    const requisitionNumber = await purchaseRequestService.generateRequestNumber(data.companyId);

    return prisma.purchaseRequisition.create({
      data: {
        companyId: data.companyId,
        requisitionNumber,
        departmentId: data.departmentId,
        requestedById: data.requestedById,
        remarks: data.remarks,
        status: "DRAFT",
        lines: {
          create: data.lines.map(line => ({
            productId: line.productId || null,
            description: line.description || "Procurement Item",
            quantity: new Decimal(line.quantity || 1),
            uom: line.uom || "UNIT",
            warehouseId: line.warehouseId || data.warehouseId || null,
            estimatedCost: line.estimatedCost ? new Decimal(line.estimatedCost) : null,
            remarks: line.remarks
          }))
        }
      },
      include: { lines: true }
    });
  },

  approveRequest: async (id: string, companyId: string, approvedById: string) => {
    const request = await purchaseRequestService.validateRequest(companyId, id);
    if (request.status !== "DRAFT" && request.status !== "SUBMITTED" && request.status !== "UNDER_REVIEW") {
      throw new Error("Purchase Request cannot be approved in its current state.");
    }

    return prisma.purchaseRequisition.update({
      where: { id },
      data: { status: "APPROVED", approvedById, approvedAt: new Date() }
    });
  },

  rejectRequest: async (id: string, companyId: string, rejectedById: string) => {
    const request = await purchaseRequestService.validateRequest(companyId, id);
    if (request.status !== "DRAFT" && request.status !== "SUBMITTED" && request.status !== "UNDER_REVIEW") {
      throw new Error("Purchase Request cannot be rejected in its current state.");
    }

    // Capture who rejected it (store in remarks or audit trail)
    return prisma.purchaseRequisition.update({
      where: { id },
      data: { status: "REJECTED", remarks: `${request.remarks || ''}\n[Rejected by ${rejectedById}]` }
    });
  },

  convertToPurchaseOrder: async (id: string, companyId: string, _userId: string) => {
    const request = await purchaseRequestService.validateRequest(companyId, id);
    if (request.status !== "APPROVED") {
      throw new Error("Purchase Request must be APPROVED before conversion to PO.");
    }

    return prisma.$transaction(async (tx) => {
      return tx.purchaseRequisition.update({
        where: { id },
        data: { status: "CONVERTED" },
        include: { lines: true }
      });
    });
  },

  cancelRequest: async (id: string, companyId: string) => {
    const request = await purchaseRequestService.validateRequest(companyId, id);
    if (request.status === "CONVERTED" || request.status === "CANCELLED") {
      throw new Error("Cannot cancel a converted or already cancelled request.");
    }

    return prisma.purchaseRequisition.update({
      where: { id },
      data: { status: "CANCELLED" }
    });
  },

  getRequestHistory: async (companyId: string, departmentId?: string) => {
    return prisma.purchaseRequisition.findMany({
      where: {
        companyId,
        ...(departmentId ? { departmentId } : {})
      },
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: true,
        approvedBy: true,
        lines: { include: { product: true } }
      }
    });
  }
};

