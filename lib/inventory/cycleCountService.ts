import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { inventoryAdjustmentService } from "./inventoryAdjustmentService";
// import { stockMovementService } from "./stockMovementService";
// import { accountingPostingService } from "../accounting/accountingPostingService";

/**
 * Version 1.3 Phase 2L: Enterprise Cycle Counting
 * Implements continuous inventory verification without shutting down full warehouse operations.
 */

export const cycleCountService = {

  generateCountNumber: async (companyId: string) => {
    const count = await prisma.cycleCount.count({ where: { companyId } });
    return `CC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  },

  calculateVariance: (systemQuantity: number | Decimal, countedQuantity: number | Decimal) => {
    const sys = new Decimal(systemQuantity);
    const phys = new Decimal(countedQuantity);
    return phys.minus(sys);
  },

  validateCount: async (companyId: string, countId: string) => {
    const count = await prisma.cycleCount.findFirst({
      where: { id: countId, companyId },
      include: { lines: true }
    });
    if (!count) throw new Error("Cycle Count not found.");
    return count;
  },

  createCycleCount: async (data: {
    companyId: string;
    warehouseId: string;
    scheduledDate: Date;
    remarks?: string;
    createdById: string;
    lines: {
      productId: string;
      batchId?: string;
      serialId?: string;
      zoneId?: string;
      binId?: string;
    }[];
  }) => {
    const countNumber = await cycleCountService.generateCountNumber(data.companyId);

    return prisma.$transaction(async (tx) => {
      // Generate the count lines by looking up the current system quantities
      const countLines = await Promise.all(data.lines.map(async (line) => {
        // Find the current system quantity in ProductWarehouse for this exact dimension
        const sysQtyRecord = await tx.productWarehouse.findFirst({
          where: {
            companyId: data.companyId,
            warehouseId: data.warehouseId,
            productId: line.productId,
            binId: line.binId || null
          }
        });
        
        const systemQuantity = sysQtyRecord?.quantity || new Decimal(0);

        return {
          productId: line.productId,
          batchId: line.batchId,
          serialId: line.serialId,
          warehouseId: data.warehouseId,
          zoneId: line.zoneId,
          binId: line.binId,
          systemQuantity,
          countStatus: "PENDING"
        };
      }));

      return tx.cycleCount.create({
        data: {
          companyId: data.companyId,
          countNumber,
          warehouseId: data.warehouseId,
          scheduledDate: data.scheduledDate,
          remarks: data.remarks,
          createdById: data.createdById,
          status: "PENDING",
          lines: {
            create: countLines
          }
        },
        include: { lines: true }
      });
    });
  },

  assignCycleCount: async (id: string, companyId: string) => {
    // Note: Assignment to a specific worker/team could be extended here
    const count = await cycleCountService.validateCount(companyId, id);
    if (count.status !== "PENDING") throw new Error("Only PENDING counts can be assigned.");
    
    return prisma.cycleCount.update({
      where: { id },
      data: { status: "COUNTING" } // Skip ASSIGNED state for brevity in Phase 2L
    });
  },

  startCount: async (id: string, companyId: string) => {
    const count = await cycleCountService.validateCount(companyId, id);
    if (count.status !== "PENDING" && count.status !== "COUNTING") {
      throw new Error("Count cannot be started.");
    }

    return prisma.cycleCount.update({
      where: { id },
      data: { status: "COUNTING", startedAt: new Date() }
    });
  },

  recordCount: async (data: {
    companyId: string;
    countId: string;
    lineId: string;
    countedQuantity: number | Decimal;
    userId: string;
  }) => {
    const count = await cycleCountService.validateCount(data.companyId, data.countId);
    if (count.status !== "COUNTING" && count.status !== "RECOUNT_REQUIRED") {
      throw new Error("Cycle count is not active.");
    }

    const line = count.lines.find(l => l.id === data.lineId);
    if (!line) throw new Error("Line not found.");

    const counted = new Decimal(data.countedQuantity);
    const variance = cycleCountService.calculateVariance(line.systemQuantity, counted);

    return prisma.cycleCountLine.update({
      where: { id: line.id },
      data: {
        countedQuantity: counted,
        variance,
        countStatus: "COUNTED"
      }
    });
  },

  approveCount: async (id: string, companyId: string, approvedById: string) => {
    const count = await cycleCountService.validateCount(companyId, id);
    if (count.status !== "COUNTING" && count.status !== "RECOUNT_REQUIRED") {
      throw new Error("Count cannot be approved in its current state.");
    }

    // Verify all lines are counted
    for (const line of count.lines) {
      if (line.countStatus !== "COUNTED") {
        throw new Error(`Line ${line.id} has not been counted yet.`);
      }
    }

    return prisma.cycleCount.update({
      where: { id },
      data: { status: "APPROVED", approvedById, completedAt: new Date() }
    });
  },

  postVariance: async (id: string, companyId: string, userId: string) => {
    const count = await cycleCountService.validateCount(companyId, id);
    if (count.status !== "APPROVED") {
      throw new Error("Cycle Count must be APPROVED before variance can be posted.");
    }

    // The Cycle Count engine DOES NOT modify the ledger itself.
    // It delegates exclusively to the Inventory Adjustment Engine.
    const varianceLines = count.lines.filter(l => l.variance && !new Decimal(l.variance as any).equals(0));
    
    if (varianceLines.length > 0) {
      // Map CycleCount lines directly to InventoryAdjustment requirements
      const adjustmentLines = varianceLines.map(line => {
        const v = new Decimal(line.variance as any);
        return {
          productId: line.productId,
          batchId: line.batchId || undefined,
          serialId: line.serialId || undefined,
          zoneId: line.zoneId || undefined,
          binId: line.binId || undefined,
          systemQuantity: line.systemQuantity,
          physicalQuantity: line.countedQuantity as any,
          adjustmentType: v.greaterThan(0) ? "CORRECTION" : "CORRECTION" as any, // Mapped generic correction
          remarks: `Cycle Count Variance (CC: ${count.countNumber})`
        };
      });

      // Delegate to Phase 2K
      const adjustment = await inventoryAdjustmentService.createAdjustment({
        companyId,
        warehouseId: count.warehouseId,
        reason: `Cycle Count Resolution: ${count.countNumber}`,
        createdById: userId,
        lines: adjustmentLines
      });

      // Auto-approve and post the adjustment to finalize the cycle count
      await inventoryAdjustmentService.approveAdjustment(adjustment.id, companyId, userId);
      await inventoryAdjustmentService.postAdjustment(adjustment.id, companyId, userId);
    }

    return prisma.cycleCount.update({
      where: { id },
      data: { status: "POSTED" }
    });
  },

  cancelCount: async (id: string, companyId: string) => {
    const count = await cycleCountService.validateCount(companyId, id);
    if (count.status === "APPROVED" || count.status === "POSTED") {
      throw new Error("Cannot cancel an approved or posted cycle count.");
    }

    return prisma.cycleCount.update({
      where: { id },
      data: { status: "CANCELLED" }
    });
  },

  getCountHistory: async (companyId: string, warehouseId?: string) => {
    return prisma.cycleCount.findMany({
      where: {
        companyId,
        ...(warehouseId ? { warehouseId } : {})
      },
      orderBy: { createdAt: "desc" },
      include: { createdBy: true, approvedBy: true, lines: true }
    });
  }
};
