import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { stockMovementService } from "./stockMovementService";

/**
 * Version 1.3 Phase 2I: Enterprise Picking Engine
 * Manages outbound WMS physical fulfillment.
 */

export const pickingService = {
  
  validatePicking: async (companyId: string, pickingTaskId: string) => {
    const task = await prisma.pickingTask.findFirst({
      where: { id: pickingTaskId, companyId },
      include: { lines: true }
    });
    if (!task) throw new Error("Picking Task not found.");
    return task;
  },

  createPickingTask: async (data: {
    companyId: string;
    warehouseId: string;
    salesOrderId?: string;
    priority?: number;
    lines: {
      productId: string;
      batchId?: string;
      serialId?: string;
      zoneId: string;
      binId: string;
      requestedQuantity: number | Decimal;
      remarks?: string;
    }[];
  }) => {
    const count = await prisma.pickingTask.count({ where: { companyId: data.companyId } });
    const taskNumber = `PICK-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    // Verify stock is available in those bins BEFORE allowing a pick task
    for (const line of data.lines) {
      const stock = await prisma.productWarehouse.findFirst({
        where: {
          companyId: data.companyId,
          warehouseId: data.warehouseId,
          productId: line.productId,
          binId: line.binId,
          quantity: { gte: line.requestedQuantity }
        }
      });
      if (!stock) {
        throw new Error(`Insufficient stock in specified bin for product ${line.productId}`);
      }
    }

    return prisma.pickingTask.create({
      data: {
        companyId: data.companyId,
        warehouseId: data.warehouseId,
        salesOrderId: data.salesOrderId,
        taskNumber,
        priority: data.priority || 1,
        status: "PENDING",
        lines: {
          create: data.lines.map(l => ({
            productId: l.productId,
            batchId: l.batchId,
            serialId: l.serialId,
            zoneId: l.zoneId,
            binId: l.binId,
            requestedQuantity: new Decimal(l.requestedQuantity),
            remarks: l.remarks
          }))
        }
      },
      include: { lines: true }
    });
  },

  assignPicking: async (companyId: string, pickingTaskId: string, employeeId: string) => {
    const task = await pickingService.validatePicking(companyId, pickingTaskId);
    if (task.status !== "PENDING" && task.status !== "ASSIGNED") {
      throw new Error("Can only assign PENDING or already ASSIGNED tasks.");
    }
    return prisma.pickingTask.update({
      where: { id: pickingTaskId },
      data: { assignedToId: employeeId, status: "ASSIGNED" }
    });
  },

  startPicking: async (companyId: string, pickingTaskId: string, employeeId: string) => {
    const task = await pickingService.validatePicking(companyId, pickingTaskId);
    if (task.status !== "ASSIGNED") {
      throw new Error("Task must be ASSIGNED before it can be started.");
    }
    if (task.assignedToId !== employeeId) {
      throw new Error("Only the assigned employee can start this task.");
    }
    return prisma.pickingTask.update({
      where: { id: pickingTaskId },
      data: { status: "IN_PROGRESS" }
    });
  },

  pickItem: async (
    companyId: string,
    pickingTaskId: string,
    lineId: string,
    pickedQuantity: number | Decimal,
    operatorId: string
  ) => {
    const task = await pickingService.validatePicking(companyId, pickingTaskId);
    if (task.status !== "IN_PROGRESS") {
      throw new Error("Task is not IN_PROGRESS.");
    }

    const line = task.lines.find(l => l.id === lineId);
    if (!line) throw new Error("Picking line not found.");

    const qty = new Decimal(pickedQuantity);
    const newPickedQty = new Decimal(line.pickedQuantity as any).plus(qty);
    if (newPickedQty.greaterThan(new Decimal(line.requestedQuantity as any))) {
      throw new Error("Cannot pick more than requested quantity.");
    }

    return prisma.$transaction(async (tx) => {
      // The actual inventory reduction happens at Sales Order completion, 
      // OR we can move it to a "Shipped" staging bin. 
      // For Phase 2I, Picking physically moves stock from the shelf to the picker's cart (or staging bin).
      // We leverage stockMovementService to do a transfer to an internal "OUTBOUND_STAGING" bin.
      
      const stagingBin = await tx.warehouseBin.findFirst({
        where: { warehouseId: task.warehouseId, code: "STAGING-OUT" }
      });

      if (!stagingBin) {
        throw new Error("A 'STAGING-OUT' bin must be configured in this warehouse.");
      }

      await stockMovementService.recordMovement(tx, {
        companyId,
        warehouseId: task.warehouseId,
        productId: line.productId,
        quantity: qty,
        movementType: "TRANSFER", // Internal movement from Shelf to Staging
        referenceType: "PICKING_TASK",
        referenceId: task.id,
        fromBinId: line.binId,
        toBinId: stagingBin.id,
        batchId: line.batchId || undefined,
        serialId: line.serialId || undefined,
        userId: operatorId
      });

      return tx.pickingTaskLine.update({
        where: { id: lineId },
        data: { pickedQuantity: newPickedQty }
      });
    });
  },

  completePicking: async (companyId: string, pickingTaskId: string, employeeId: string) => {
    const task = await pickingService.validatePicking(companyId, pickingTaskId);
    if (task.status !== "IN_PROGRESS") {
      throw new Error("Task is not IN_PROGRESS.");
    }

    for (const line of task.lines) {
      if (new Decimal(line.pickedQuantity as any).lessThan(new Decimal(line.requestedQuantity as any))) {
        throw new Error("Cannot complete picking. Some lines are not fully picked.");
      }
    }

    return prisma.pickingTask.update({
      where: { id: pickingTaskId },
      data: { status: "PICKED", completedAt: new Date() }
    });
  },

  cancelPicking: async (companyId: string, pickingTaskId: string) => {
    const task = await pickingService.validatePicking(companyId, pickingTaskId);
    if (task.status === "COMPLETED" || task.status === "CANCELLED" || task.status === "PICKED") {
      throw new Error("Cannot cancel a completed or picked task.");
    }
    return prisma.pickingTask.update({
      where: { id: pickingTaskId },
      data: { status: "CANCELLED" }
    });
  },

  recommendPickSequence: async (companyId: string, pickingTaskId: string) => {
    const task = await pickingService.validatePicking(companyId, pickingTaskId);
    // Real WMS optimization: sorts lines by Zone/Bin code to minimize walk time (Traveling Salesman routing)
    // Stubbed for Phase 2I
    return task.lines.sort((a, b) => a.binId.localeCompare(b.binId));
  },

  getPickingHistory: async (companyId: string, warehouseId?: string) => {
    return prisma.pickingTask.findMany({
      where: { companyId, ...(warehouseId ? { warehouseId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { lines: true, assignedTo: true }
    });
  }
};
