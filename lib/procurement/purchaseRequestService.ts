import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Version 1.3 Phase 2N: Purchase Request Workflow
 * Manages procurement requests prior to PO conversion.
 */

export const purchaseRequestService = {

  generateRequestNumber: async (companyId: string) => {
    const count = await prisma.purchaseRequest.count({ where: { companyId } });
    return `PR-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  },

  validateRequest: async (companyId: string, requestId: string) => {
    const request = await prisma.purchaseRequest.findFirst({
      where: { id: requestId, companyId },
      include: { lines: true }
    });
    if (!request) throw new Error("Purchase Request not found.");
    return request;
  },

  createRequest: async (data: {
    companyId: string;
    warehouseId: string;
    requestedById: string;
    remarks?: string;
    lines: {
      productId: string;
      requiredQuantity: number | Decimal;
      recommendedQuantity: number | Decimal;
      supplierId?: string;
      estimatedUnitCost?: number | Decimal;
      remarks?: string;
    }[];
  }) => {
    const requestNumber = await purchaseRequestService.generateRequestNumber(data.companyId);

    return prisma.purchaseRequest.create({
      data: {
        companyId: data.companyId,
        requestNumber,
        warehouseId: data.warehouseId,
        requestedById: data.requestedById,
        remarks: data.remarks,
        status: "DRAFT",
        lines: {
          create: data.lines.map(line => ({
            productId: line.productId,
            requiredQuantity: new Decimal(line.requiredQuantity),
            recommendedQuantity: new Decimal(line.recommendedQuantity),
            supplierId: line.supplierId,
            estimatedUnitCost: line.estimatedUnitCost ? new Decimal(line.estimatedUnitCost) : null,
            remarks: line.remarks
          }))
        }
      },
      include: { lines: true }
    });
  },

  approveRequest: async (id: string, companyId: string, approvedById: string) => {
    const request = await purchaseRequestService.validateRequest(companyId, id);
    if (request.status !== "DRAFT" && request.status !== "PENDING_APPROVAL") {
      throw new Error("Purchase Request cannot be approved in its current state.");
    }

    return prisma.purchaseRequest.update({
      where: { id },
      data: { status: "APPROVED", approvedById }
    });
  },

  rejectRequest: async (id: string, companyId: string, rejectedById: string) => {
    const request = await purchaseRequestService.validateRequest(companyId, id);
    if (request.status !== "DRAFT" && request.status !== "PENDING_APPROVAL") {
      throw new Error("Purchase Request cannot be rejected in its current state.");
    }

    // Capture who rejected it (store in remarks or audit trail)
    return prisma.purchaseRequest.update({
      where: { id },
      data: { status: "REJECTED", remarks: `${request.remarks || ''}\n[Rejected by ${rejectedById}]` }
    });
  },

  convertToPurchaseOrder: async (id: string, companyId: string, userId: string) => {
    const request = await purchaseRequestService.validateRequest(companyId, id);
    if (request.status !== "APPROVED") {
      throw new Error("Purchase Request must be APPROVED before conversion to PO.");
    }

    // Group lines by Supplier to generate separate POs
    const linesBySupplier = request.lines.reduce((acc, line) => {
      const supId = line.supplierId || "UNKNOWN";
      if (!acc[supId]) acc[supId] = [];
      acc[supId].push(line);
      return acc;
    }, {} as Record<string, typeof request.lines>);

    return prisma.$transaction(async (tx) => {
      // Loop over suppliers and dynamically call purchaseOrder engine
      for (const [supplierId, lines] of Object.entries(linesBySupplier)) {
        if (supplierId === "UNKNOWN") {
          throw new Error("Cannot convert Purchase Request lines without an assigned Supplier.");
        }

        // Logic here delegates to existing Purchase Order Service (Version 1.2/1.3)
        // Stubs representing the PO generation loop:
        
        // const po = await purchaseOrderService.create(...)
        // await tx.purchaseOrder.create({...})
      }

      return tx.purchaseRequest.update({
        where: { id },
        data: { status: "CONVERTED_TO_PO" },
        include: { lines: true }
      });
    });
  },

  cancelRequest: async (id: string, companyId: string) => {
    const request = await purchaseRequestService.validateRequest(companyId, id);
    if (request.status === "CONVERTED_TO_PO" || request.status === "CANCELLED") {
      throw new Error("Cannot cancel a converted or already cancelled request.");
    }

    return prisma.purchaseRequest.update({
      where: { id },
      data: { status: "CANCELLED" }
    });
  },

  getRequestHistory: async (companyId: string, warehouseId?: string) => {
    return prisma.purchaseRequest.findMany({
      where: {
        companyId,
        ...(warehouseId ? { warehouseId } : {})
      },
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: true,
        approvedBy: true,
        lines: { include: { product: true, supplier: true } }
      }
    });
  }
};
