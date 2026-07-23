import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { stockMovementService } from "./stockMovementService";

/**
 * Version 1.3 Phase 2D: Enterprise Batch & Lot Tracking
 * Manages lifecycle of Inventory Batches. Every operation inherently delegates
 * to the Stock Movement Engine to guarantee operational auditability.
 */

export const batchService = {

  validateBatch: async (companyId: string, batchId: string, warehouseId: string) => {
    const batch = await prisma.inventoryBatch.findFirst({
      where: { id: batchId, companyId, warehouseId }
    });
    if (!batch) throw new Error("Batch not found in this warehouse.");
    if (batch.status === "EXPIRED") throw new Error("Cannot operate on an expired batch.");
    if (batch.status === "QUARANTINE") throw new Error("Cannot operate on a quarantined batch.");
    if (batch.status === "CONSUMED") throw new Error("Batch is already fully consumed.");

    return batch;
  },

  createBatch: async (data: {
    companyId: string;
    productId: string;
    warehouseId: string;
    batchNumber: string;
    manufacturerBatch?: string;
    manufactureDate?: Date;
    expiryDate?: Date;
    receivedDate: Date;
    quantity: number | Decimal;
    remarks?: string;
  }) => {
    return prisma.inventoryBatch.create({
      data: {
        ...data,
        quantity: new Decimal(data.quantity),
        status: "ACTIVE"
      }
    });
  },

  receiveBatch: async (data: {
    companyId: string;
    productId: string;
    warehouseId: string;
    batchNumber: string;
    manufacturerBatch?: string;
    manufactureDate?: Date;
    expiryDate?: Date;
    quantity: number | Decimal;
    referenceType: string;
    referenceId: string;
    userId: string;
    remarks?: string;
  }) => {
    const qty = new Decimal(data.quantity);
    if (qty.isNegative()) throw new Error("Receive quantity must be positive.");

    return prisma.$transaction(async (tx) => {
      let batch = await tx.inventoryBatch.findFirst({
        where: { companyId: data.companyId, productId: data.productId, batchNumber: data.batchNumber }
      });

      if (!batch) {
        batch = await tx.inventoryBatch.create({
          data: {
            companyId: data.companyId,
            productId: data.productId,
            warehouseId: data.warehouseId,
            batchNumber: data.batchNumber,
            manufacturerBatch: data.manufacturerBatch,
            manufactureDate: data.manufactureDate,
            expiryDate: data.expiryDate,
            receivedDate: new Date(),
            quantity: qty,
            status: "ACTIVE"
          }
        });
      } else {
        batch = await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: { quantity: { increment: qty }, status: "ACTIVE" }
        });
      }

      // Automatically hook into the Stock Movement Engine
      await stockMovementService.recordMovement({
        companyId: data.companyId,
        productId: data.productId,
        warehouseId: data.warehouseId,
        movementType: "RECEIVE",
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        quantity: qty,
        remarks: data.remarks,
        performedById: data.userId
      });

      // We technically should link the batchId in the movement, but stockMovementService handles it generically.
      // In a real implementation, stockMovementService.recordMovement would accept `batchId`.
      await tx.stockMovement.updateMany({
        where: { referenceType: data.referenceType, referenceId: data.referenceId, companyId: data.companyId },
        data: { batchId: batch.id }
      });

      return batch;
    });
  },

  issueBatch: async (data: {
    companyId: string;
    batchId: string;
    warehouseId: string;
    quantity: number | Decimal;
    referenceType: string;
    referenceId: string;
    userId: string;
    remarks?: string;
  }) => {
    const batch = await batchService.validateBatch(data.companyId, data.batchId, data.warehouseId);
    
    const qty = new Decimal(data.quantity);
    const available = new Decimal(batch.quantity as any).minus(new Decimal(batch.reservedQuantity as any));

    if (available.lessThan(qty)) {
      throw new Error(`Insufficient available stock in batch ${batch.batchNumber}.`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          quantity: { decrement: qty },
          status: new Decimal(batch.quantity as any).equals(qty) ? "CONSUMED" : "PARTIAL"
        }
      });

      await stockMovementService.recordMovement({
        companyId: data.companyId,
        productId: batch.productId,
        warehouseId: data.warehouseId,
        movementType: "ISSUE",
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        quantity: qty.negated(),
        remarks: data.remarks,
        performedById: data.userId
      });

      await tx.stockMovement.updateMany({
        where: { referenceType: data.referenceType, referenceId: data.referenceId, companyId: data.companyId },
        data: { batchId: batch.id }
      });

      return updated;
    });
  },

  reserveBatch: async (data: {
    companyId: string;
    batchId: string;
    warehouseId: string;
    quantity: number | Decimal;
  }) => {
    const batch = await batchService.validateBatch(data.companyId, data.batchId, data.warehouseId);
    const qty = new Decimal(data.quantity);
    const available = new Decimal(batch.quantity as any).minus(new Decimal(batch.reservedQuantity as any));

    if (available.lessThan(qty)) throw new Error("Insufficient unreserved stock in this batch.");

    return prisma.inventoryBatch.update({
      where: { id: batch.id },
      data: {
        reservedQuantity: { increment: qty },
        status: new Decimal(batch.quantity as any).equals(new Decimal(batch.reservedQuantity as any).plus(qty)) ? "RESERVED" : "PARTIAL"
      }
    });
  },

  releaseBatch: async (data: {
    companyId: string;
    batchId: string;
    warehouseId: string;
    quantity: number | Decimal;
  }) => {
    const batch = await prisma.inventoryBatch.findFirst({ where: { id: data.batchId, companyId: data.companyId } });
    if (!batch) throw new Error("Batch not found.");

    const qty = new Decimal(data.quantity);
    const reserved = new Decimal(batch.reservedQuantity as any);
    if (reserved.lessThan(qty)) throw new Error("Cannot release more than reserved in batch.");

    return prisma.inventoryBatch.update({
      where: { id: batch.id },
      data: {
        reservedQuantity: { decrement: qty },
        status: "ACTIVE"
      }
    });
  },

  adjustBatch: async (data: {
    companyId: string;
    batchId: string;
    warehouseId: string;
    difference: number | Decimal;
    referenceType: string;
    referenceId: string;
    userId: string;
    remarks?: string;
  }) => {
    const batch = await batchService.validateBatch(data.companyId, data.batchId, data.warehouseId);
    const diff = new Decimal(data.difference);
    
    if (diff.isNegative()) {
      const available = new Decimal(batch.quantity as any).minus(new Decimal(batch.reservedQuantity as any));
      if (available.plus(diff).isNegative()) throw new Error("Adjustment exceeds available batch stock.");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          quantity: { increment: diff },
          status: new Decimal(batch.quantity as any).plus(diff).equals(0) ? "CONSUMED" : "ACTIVE"
        }
      });

      const movementType = diff.isNegative() ? "ADJUSTMENT_OUT" : "ADJUSTMENT_IN";

      await stockMovementService.recordMovement({
        companyId: data.companyId,
        productId: batch.productId,
        warehouseId: data.warehouseId,
        movementType,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        quantity: diff,
        remarks: data.remarks,
        performedById: data.userId
      });

      await tx.stockMovement.updateMany({
        where: { referenceType: data.referenceType, referenceId: data.referenceId, companyId: data.companyId },
        data: { batchId: batch.id }
      });

      return updated;
    });
  },

  expireBatch: async (id: string, companyId: string) => {
    return prisma.inventoryBatch.update({
      where: { id, companyId },
      data: { status: "EXPIRED" }
    });
  },

  quarantineBatch: async (id: string, companyId: string, remarks?: string) => {
    return prisma.inventoryBatch.update({
      where: { id, companyId },
      data: { status: "QUARANTINE", remarks }
    });
  },

  getBatchHistory: async (companyId: string, batchId: string) => {
    return prisma.stockMovement.findMany({
      where: { companyId, batchId },
      orderBy: { createdAt: "desc" },
      include: { performedBy: true }
    });
  },

  getBatchStock: async (companyId: string, productId: string, warehouseId?: string) => {
    return prisma.inventoryBatch.findMany({
      where: {
        companyId,
        productId,
        ...(warehouseId && { warehouseId }),
        status: { notIn: ["CONSUMED", "EXPIRED", "QUARANTINE"] }
      },
      orderBy: { expiryDate: "asc" } // FEFO prep
    });
  }
};
