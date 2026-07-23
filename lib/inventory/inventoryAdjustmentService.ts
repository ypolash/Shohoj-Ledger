import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { stockMovementService } from "./stockMovementService";
// import { accountingPostingService } from "../accounting/accountingPostingService";

/**
 * Version 1.3 Phase 2K: Enterprise Inventory Adjustment & Reconciliation
 * The sole mechanism for correcting stock variances, mapping physical reality to the financial ledger.
 */

export const inventoryAdjustmentService = {

  generateAdjustmentNumber: async (companyId: string) => {
    const count = await prisma.inventoryAdjustment.count({ where: { companyId } });
    return `ADJ-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  },

  calculateVariance: (systemQuantity: number | Decimal, physicalQuantity: number | Decimal) => {
    const sys = new Decimal(systemQuantity);
    const phys = new Decimal(physicalQuantity);
    return phys.minus(sys);
  },

  validateAdjustment: async (companyId: string, adjustmentId: string) => {
    const adjustment = await prisma.inventoryAdjustment.findFirst({
      where: { id: adjustmentId, companyId },
      include: { lines: true }
    });
    if (!adjustment) throw new Error("Inventory Adjustment not found.");
    return adjustment;
  },

  createAdjustment: async (data: {
    companyId: string;
    warehouseId: string;
    reason: string;
    remarks?: string;
    createdById: string;
    lines: {
      productId: string;
      batchId?: string;
      serialId?: string;
      zoneId?: string;
      binId?: string;
      systemQuantity: number | Decimal;
      physicalQuantity: number | Decimal;
      adjustmentType: "GAIN" | "LOSS" | "DAMAGE" | "EXPIRED" | "SCRAP" | "FOUND" | "CORRECTION" | "WRITE_OFF";
      remarks?: string;
    }[];
  }) => {
    const adjustmentNumber = await inventoryAdjustmentService.generateAdjustmentNumber(data.companyId);

    return prisma.inventoryAdjustment.create({
      data: {
        companyId: data.companyId,
        adjustmentNumber,
        warehouseId: data.warehouseId,
        reason: data.reason,
        remarks: data.remarks,
        createdById: data.createdById,
        status: "DRAFT",
        lines: {
          create: data.lines.map(line => {
            const variance = inventoryAdjustmentService.calculateVariance(line.systemQuantity, line.physicalQuantity);
            
            // Basic sanity check: Loss cannot have a positive variance
            if (["LOSS", "DAMAGE", "EXPIRED", "SCRAP", "WRITE_OFF"].includes(line.adjustmentType) && variance.greaterThan(0)) {
              throw new Error("A loss-type adjustment cannot result in a positive variance.");
            }
            if (["GAIN", "FOUND"].includes(line.adjustmentType) && variance.lessThan(0)) {
              throw new Error("A gain-type adjustment cannot result in a negative variance.");
            }

            return {
              productId: line.productId,
              batchId: line.batchId,
              serialId: line.serialId,
              warehouseId: data.warehouseId,
              zoneId: line.zoneId,
              binId: line.binId,
              systemQuantity: new Decimal(line.systemQuantity),
              physicalQuantity: new Decimal(line.physicalQuantity),
              adjustmentQuantity: variance,
              adjustmentType: line.adjustmentType,
              remarks: line.remarks
            };
          })
        }
      },
      include: { lines: true }
    });
  },

  approveAdjustment: async (id: string, companyId: string, approvedById: string) => {
    const adjustment = await inventoryAdjustmentService.validateAdjustment(companyId, id);
    if (adjustment.status !== "DRAFT" && adjustment.status !== "PENDING_APPROVAL") {
      throw new Error("Adjustment cannot be approved in its current state.");
    }

    return prisma.inventoryAdjustment.update({
      where: { id },
      data: { status: "APPROVED", approvedById }
    });
  },

  postAdjustment: async (id: string, companyId: string, userId: string) => {
    const adjustment = await inventoryAdjustmentService.validateAdjustment(companyId, id);
    if (adjustment.status !== "APPROVED") {
      throw new Error("Adjustment must be APPROVED before it can be posted.");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Post to the Physical Stock Ledger (StockMovement)
      for (const line of adjustment.lines) {
        if (new Decimal(line.adjustmentQuantity as any).equals(0)) continue;

        await stockMovementService.recordMovement({
          companyId,
          productId: line.productId,
          warehouseId: line.warehouseId,
          zoneId: line.zoneId || undefined,
          binId: line.binId || undefined,
          movementType: "ADJUSTMENT",
          referenceType: "INVENTORY_ADJUSTMENT",
          referenceId: adjustment.id,
          quantity: new Decimal(line.adjustmentQuantity as any),
          performedById: userId
        });
      }

      // 2. Post to the Accounting Ledger
      // Future Integration Point:
      // accountingPostingService.post({
      //   companyId,
      //   referenceType: "INVENTORY_ADJUSTMENT",
      //   referenceId: adjustment.id,
      //   ...
      // });

      return tx.inventoryAdjustment.update({
        where: { id },
        data: { status: "POSTED" },
        include: { lines: true }
      });
    });
  },

  cancelAdjustment: async (id: string, companyId: string) => {
    const adjustment = await inventoryAdjustmentService.validateAdjustment(companyId, id);
    if (adjustment.status === "POSTED" || adjustment.status === "CANCELLED") {
      throw new Error("Cannot cancel a posted or already cancelled adjustment.");
    }

    return prisma.inventoryAdjustment.update({
      where: { id },
      data: { status: "CANCELLED" }
    });
  },

  getAdjustmentHistory: async (companyId: string, warehouseId?: string) => {
    return prisma.inventoryAdjustment.findMany({
      where: {
        companyId,
        ...(warehouseId ? { warehouseId } : {})
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: true,
        approvedBy: true,
        lines: { include: { product: true } }
      }
    });
  }
};
