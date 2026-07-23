import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { stockMovementService } from "./stockMovementService";
import { valuationService } from "./valuationService";

/**
 * Version 1.3 Phase 2I: Enterprise Packing Engine
 * Manages the transition from Picked items to Shipped items.
 */

export const packingService = {
  
  validatePacking: async (companyId: string, packingTaskId: string) => {
    const task = await prisma.packingTask.findFirst({
      where: { id: packingTaskId, companyId },
      include: { pickingTask: { include: { lines: true } } }
    });
    if (!task) throw new Error("Packing Task not found.");
    return task;
  },

  createPacking: async (companyId: string, warehouseId: string, pickingTaskId: string) => {
    const pickTask = await prisma.pickingTask.findFirst({
      where: { id: pickingTaskId, companyId }
    });
    
    if (!pickTask) throw new Error("Picking Task not found.");
    if (pickTask.status !== "PICKED") throw new Error("Can only pack fully PICKED tasks.");

    const count = await prisma.packingTask.count({ where: { companyId } });
    const packingNumber = `PACK-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    return prisma.packingTask.create({
      data: {
        companyId,
        warehouseId,
        pickingTaskId,
        packingNumber,
        status: "PENDING"
      },
      include: { pickingTask: { include: { lines: true } } }
    });
  },

  packItem: async (
    companyId: string, 
    packingTaskId: string, 
    pickingLineId: string, 
    packedQuantity: number | Decimal,
    operatorId: string
  ) => {
    const packTask = await packingService.validatePacking(companyId, packingTaskId);
    if (packTask.status !== "PENDING" && packTask.status !== "PACKING") {
      throw new Error("Task is not active for packing.");
    }

    const line = packTask.pickingTask.lines.find(l => l.id === pickingLineId);
    if (!line) throw new Error("Picking line not found in this task.");

    const qty = new Decimal(packedQuantity);
    const newPackedQty = new Decimal(line.packedQuantity as any).plus(qty);
    
    if (newPackedQty.greaterThan(new Decimal(line.pickedQuantity as any))) {
      throw new Error("Cannot pack more than was picked.");
    }

    return prisma.$transaction(async (tx) => {
      // Update task status if it was PENDING
      if (packTask.status === "PENDING") {
        await tx.packingTask.update({
          where: { id: packingTaskId },
          data: { status: "PACKING", packedById: operatorId }
        });
      }

      return tx.pickingTaskLine.update({
        where: { id: pickingLineId },
        data: { packedQuantity: newPackedQty }
      });
    });
  },

  completePacking: async (companyId: string, packingTaskId: string) => {
    const packTask = await packingService.validatePacking(companyId, packingTaskId);
    
    // Verify all picked items are packed
    for (const line of packTask.pickingTask.lines) {
      if (new Decimal(line.packedQuantity as any).lessThan(new Decimal(line.pickedQuantity as any))) {
        throw new Error("Cannot complete. Not all picked items have been packed.");
      }
    }

    return prisma.$transaction(async (tx) => {
      // When packing completes, the inventory physically leaves the warehouse.
      // This is an OUTBOUND ISSUE transaction.
      // We deduct from the STAGING-OUT bin where the picker placed it.
      const stagingBin = await tx.warehouseBin.findFirst({
        where: { warehouseId: packTask.warehouseId, code: "STAGING-OUT" }
      });

      if (!stagingBin) throw new Error("STAGING-OUT bin not found.");

      for (const line of packTask.pickingTask.lines) {
        const qty = new Decimal(line.packedQuantity as any);
        if (qty.greaterThan(0)) {
          // 1. Physical Movement (Issue)
          await stockMovementService.recordMovement(tx, {
            companyId,
            warehouseId: packTask.warehouseId,
            productId: line.productId,
            quantity: qty,
            movementType: "ISSUE",
            referenceType: "PACKING_TASK",
            referenceId: packTask.id,
            fromBinId: stagingBin.id,
            batchId: line.batchId || undefined,
            serialId: line.serialId || undefined,
            userId: packTask.packedById || "SYSTEM"
          });

          // 2. Financial Valuation Consumption (FIFO)
          // Delegate to Phase 2M Valuation Engine to calculate exact COGS
          const cogs = await valuationService.consumeLayer(tx, {
            companyId,
            productId: line.productId,
            warehouseId: packTask.warehouseId,
            quantity: qty
          });

          // Future Phase: Post Journal Entry with exact `cogs` via PostingService
        }
      }

      await tx.pickingTask.update({
        where: { id: packTask.pickingTaskId },
        data: { status: "COMPLETED" }
      });

      return tx.packingTask.update({
        where: { id: packingTaskId },
        data: { status: "COMPLETED", packedAt: new Date() }
      });
    });
  },

  cancelPacking: async (companyId: string, packingTaskId: string) => {
    const packTask = await packingService.validatePacking(companyId, packingTaskId);
    if (packTask.status === "COMPLETED" || packTask.status === "CANCELLED") {
      throw new Error("Cannot cancel a completed or already cancelled packing task.");
    }
    return prisma.packingTask.update({
      where: { id: packingTaskId },
      data: { status: "CANCELLED" }
    });
  },

  getPackingHistory: async (companyId: string, warehouseId?: string) => {
    return prisma.packingTask.findMany({
      where: { companyId, ...(warehouseId ? { warehouseId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { pickingTask: true, packedBy: true }
    });
  }
};
