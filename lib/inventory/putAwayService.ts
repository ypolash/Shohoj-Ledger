import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { stockMovementService } from "./stockMovementService";
// import { goodsReceiptService } from "./goodsReceiptService";

/**
 * Version 1.3 Phase 2H: Enterprise Put-away Strategy
 * Manages the transition of stock from the Receiving Dock to final Bin locations.
 */

export const putAwayService = {

  validateTask: async (companyId: string, taskId: string) => {
    const task = await prisma.putAwayTask.findFirst({
      where: { id: taskId, companyId },
      include: { lines: true }
    });
    if (!task) throw new Error("Put-away task not found.");
    if (task.status === "COMPLETED" || task.status === "CANCELLED") {
      throw new Error("Task cannot be modified in its current state.");
    }
    return task;
  },

  createTask: async (data: {
    companyId: string;
    warehouseId: string;
    goodsReceiptId?: string;
    priority?: number;
    lines: {
      productId: string;
      batchId?: string;
      serialId?: string;
      fromZoneId: string;
      fromBinId: string;
      toZoneId: string;
      toBinId: string;
      quantity: number | Decimal;
      remarks?: string;
    }[];
  }) => {
    const taskNumber = `PA-${Date.now()}`;

    return prisma.putAwayTask.create({
      data: {
        companyId: data.companyId,
        warehouseId: data.warehouseId,
        goodsReceiptId: data.goodsReceiptId,
        taskNumber,
        status: "PENDING",
        priority: data.priority ?? 0,
        lines: {
          create: data.lines.map(line => ({
            productId: line.productId,
            batchId: line.batchId,
            serialId: line.serialId,
            fromZoneId: line.fromZoneId,
            fromBinId: line.fromBinId,
            toZoneId: line.toZoneId,
            toBinId: line.toBinId,
            quantity: new Decimal(line.quantity),
            remarks: line.remarks
          }))
        }
      },
      include: { lines: true }
    });
  },

  assignTask: async (id: string, companyId: string, employeeId: string) => {
    await putAwayService.validateTask(companyId, id);
    return prisma.putAwayTask.update({
      where: { id },
      data: { assignedToId: employeeId, status: "ASSIGNED" }
    });
  },

  startTask: async (id: string, companyId: string) => {
    const task = await putAwayService.validateTask(companyId, id);
    if (task.status !== "ASSIGNED" && task.status !== "PENDING") throw new Error("Task cannot be started.");
    
    return prisma.putAwayTask.update({
      where: { id },
      data: { status: "IN_PROGRESS" }
    });
  },

  moveStock: async (data: {
    companyId: string;
    taskId: string;
    lineId: string;
    quantity: number | Decimal;
    userId: string;
  }) => {
    const task = await putAwayService.validateTask(data.companyId, data.taskId);
    if (task.status !== "IN_PROGRESS") throw new Error("Task must be IN_PROGRESS to move stock.");

    const line = task.lines.find(l => l.id === data.lineId);
    if (!line) throw new Error("Line not found.");

    const qty = new Decimal(data.quantity);
    const completed = new Decimal(line.completedQuantity as any);
    const required = new Decimal(line.quantity as any);

    if (completed.plus(qty).greaterThan(required)) {
      throw new Error("Cannot move more than requested put-away quantity.");
    }

    return prisma.$transaction(async (tx) => {
      // Execute the physical bin-to-bin movement
      await stockMovementService.recordMovement({
        companyId: data.companyId,
        productId: line.productId,
        warehouseId: task.warehouseId,
        zoneId: line.fromZoneId,
        binId: line.fromBinId,
        movementType: "BIN_TRANSFER_OUT",
        referenceType: "PUTAWAY_TASK",
        referenceId: task.id,
        quantity: qty.negated(),
        performedById: data.userId
      });

      await stockMovementService.recordMovement({
        companyId: data.companyId,
        productId: line.productId,
        warehouseId: task.warehouseId,
        zoneId: line.toZoneId,
        binId: line.toBinId,
        movementType: "BIN_TRANSFER_IN",
        referenceType: "PUTAWAY_TASK",
        referenceId: task.id,
        quantity: qty,
        performedById: data.userId
      });

      // Update the PutAway line completed quantity
      const updatedLine = await tx.putAwayTaskLine.update({
        where: { id: line.id },
        data: { completedQuantity: { increment: qty } }
      });

      // Tie Batch/Serial to the new location if applicable (Handled implicitly by stock engine)
      if (line.batchId || line.serialId) {
        await tx.stockMovement.updateMany({
          where: { referenceType: "PUTAWAY_TASK", referenceId: task.id, companyId: data.companyId },
          data: { batchId: line.batchId, serialId: line.serialId }
        });
      }

      return updatedLine;
    });
  },

  completeTask: async (id: string, companyId: string) => {
    const task = await putAwayService.validateTask(companyId, id);
    
    for (const line of task.lines) {
      const completed = new Decimal(line.completedQuantity as any);
      const requested = new Decimal(line.quantity as any);
      if (!completed.equals(requested)) {
        throw new Error(`Line ${line.id} is not fully completed.`);
      }
    }

    return prisma.putAwayTask.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() }
    });
  },

  cancelTask: async (id: string, companyId: string) => {
    const task = await putAwayService.validateTask(companyId, id);
    if (task.status === "COMPLETED") throw new Error("Cannot cancel completed task.");

    // Note: Reversal of partially moved lines would be required here in a full deployment
    return prisma.putAwayTask.update({
      where: { id },
      data: { status: "CANCELLED" }
    });
  },

  recommendBin: async (companyId: string, warehouseId: string, productId: string) => {
    // Basic Bin Recommendation logic (Nearest Empty Bin or Preferred Bin)
    // 1. Find bins where this product is already stored
    const existingLocations = await prisma.productWarehouse.findMany({
      where: { companyId, productId, warehouseId, binId: { not: null } },
      include: { bin: true }
    });

    if (existingLocations.length > 0) {
      return existingLocations.map(l => l.bin);
    }

    // 2. Otherwise find an empty/active bin
    const emptyBins = await prisma.warehouseBin.findMany({
      where: { warehouseId, isActive: true },
      take: 5
    });

    return emptyBins;
  },

  getPendingTasks: async (companyId: string, warehouseId: string) => {
    return prisma.putAwayTask.findMany({
      where: { companyId, warehouseId, status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] } },
      include: { assignedTo: true, lines: true }
    });
  },

  getTaskHistory: async (companyId: string, warehouseId: string) => {
    return prisma.putAwayTask.findMany({
      where: { companyId, warehouseId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      include: { assignedTo: true, lines: true }
    });
  }
};
