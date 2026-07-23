import prisma from "@/lib/prisma";
import { stockMovementService } from "./stockMovementService";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Version 1.3 Phase 2E: Enterprise Serial Number Tracking
 * Manages lifecycle of uniquely serialized inventory. 
 * Every status mutation delegates inherently to the Stock Movement Engine.
 */

export const serialService = {

  validateSerial: async (companyId: string, serialId: string, warehouseId: string) => {
    const serial = await prisma.inventorySerial.findFirst({
      where: { id: serialId, companyId, warehouseId }
    });
    if (!serial) throw new Error("Serial not found in this warehouse.");
    return serial;
  },

  createSerial: async (data: {
    companyId: string;
    productId: string;
    warehouseId: string;
    batchId?: string;
    serialNumber: string;
    remarks?: string;
  }) => {
    return prisma.inventorySerial.create({
      data: {
        ...data,
        receivedDate: new Date(),
        status: "AVAILABLE"
      }
    });
  },

  receiveSerial: async (data: {
    companyId: string;
    productId: string;
    warehouseId: string;
    batchId?: string;
    serialNumber: string;
    referenceType: string;
    referenceId: string;
    userId: string;
    remarks?: string;
  }) => {
    return prisma.$transaction(async (tx) => {
      // Create the Serial Entity
      const serial = await tx.inventorySerial.create({
        data: {
          companyId: data.companyId,
          productId: data.productId,
          warehouseId: data.warehouseId,
          batchId: data.batchId,
          serialNumber: data.serialNumber,
          receivedDate: new Date(),
          status: "AVAILABLE",
          remarks: data.remarks
        }
      });

      // Hook into the Stock Movement Engine (Qty = +1)
      await stockMovementService.recordMovement({
        companyId: data.companyId,
        productId: data.productId,
        warehouseId: data.warehouseId,
        movementType: "RECEIVE",
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        quantity: 1,
        remarks: data.remarks,
        performedById: data.userId
      });

      // Attach the serial ID to the movement
      await tx.stockMovement.updateMany({
        where: { referenceType: data.referenceType, referenceId: data.referenceId, companyId: data.companyId },
        data: { serialId: serial.id }
      });

      return serial;
    });
  },

  issueSerial: async (data: {
    companyId: string;
    serialId: string;
    warehouseId: string;
    referenceType: string;
    referenceId: string;
    assignedCustomerId?: string;
    userId: string;
    remarks?: string;
  }) => {
    const serial = await serialService.validateSerial(data.companyId, data.serialId, data.warehouseId);
    
    if (serial.status === "SOLD") throw new Error("Serial is already sold.");
    if (serial.status === "SCRAPPED") throw new Error("Serial is scrapped and cannot be issued.");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.inventorySerial.update({
        where: { id: serial.id },
        data: {
          status: "SOLD",
          soldDate: new Date(),
          assignedCustomerId: data.assignedCustomerId,
          remarks: data.remarks
        }
      });

      await stockMovementService.recordMovement({
        companyId: data.companyId,
        productId: serial.productId,
        warehouseId: data.warehouseId,
        movementType: "ISSUE",
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        quantity: -1,
        remarks: `Issued serial ${serial.serialNumber}`,
        performedById: data.userId
      });

      await tx.stockMovement.updateMany({
        where: { referenceType: data.referenceType, referenceId: data.referenceId, companyId: data.companyId },
        data: { serialId: serial.id }
      });

      return updated;
    });
  },

  reserveSerial: async (data: {
    companyId: string;
    serialId: string;
    warehouseId: string;
    referenceType: string;
    referenceId: string;
    userId: string;
  }) => {
    const serial = await serialService.validateSerial(data.companyId, data.serialId, data.warehouseId);
    if (serial.status !== "AVAILABLE") throw new Error("Only AVAILABLE serials can be reserved.");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.inventorySerial.update({
        where: { id: serial.id },
        data: { status: "RESERVED" }
      });

      // Logical movement (Qty 0) to track reservation via StockMovementEngine
      await stockMovementService.recordMovement({
        companyId: data.companyId,
        productId: serial.productId,
        warehouseId: data.warehouseId,
        movementType: "RESERVE",
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        quantity: 0,
        remarks: `Reserved serial ${serial.serialNumber}`,
        performedById: data.userId
      });

      await tx.stockMovement.updateMany({
        where: { referenceType: data.referenceType, referenceId: data.referenceId, companyId: data.companyId },
        data: { serialId: serial.id }
      });

      return updated;
    });
  },

  releaseSerial: async (data: {
    companyId: string;
    serialId: string;
    warehouseId: string;
    referenceType: string;
    referenceId: string;
    userId: string;
  }) => {
    const serial = await serialService.validateSerial(data.companyId, data.serialId, data.warehouseId);
    if (serial.status !== "RESERVED") throw new Error("Only RESERVED serials can be released.");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.inventorySerial.update({
        where: { id: serial.id },
        data: { status: "AVAILABLE" }
      });

      await stockMovementService.recordMovement({
        companyId: data.companyId,
        productId: serial.productId,
        warehouseId: data.warehouseId,
        movementType: "RELEASE",
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        quantity: 0,
        remarks: `Released serial ${serial.serialNumber}`,
        performedById: data.userId
      });

      await tx.stockMovement.updateMany({
        where: { referenceType: data.referenceType, referenceId: data.referenceId, companyId: data.companyId },
        data: { serialId: serial.id }
      });

      return updated;
    });
  },

  transferSerial: async (data: {
    companyId: string;
    serialId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    referenceType: string;
    referenceId: string;
    userId: string;
  }) => {
    const serial = await serialService.validateSerial(data.companyId, data.serialId, data.fromWarehouseId);
    if (serial.status !== "AVAILABLE") throw new Error("Only AVAILABLE serials can be transferred.");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.inventorySerial.update({
        where: { id: serial.id },
        data: { warehouseId: data.toWarehouseId }
      });

      // Transfer executes two movements (OUT and IN) atomically
      await stockMovementService.transfer({
        companyId: data.companyId,
        productId: serial.productId,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        quantity: 1,
        performedById: data.userId
      });

      await tx.stockMovement.updateMany({
        where: { referenceType: data.referenceType, referenceId: data.referenceId, companyId: data.companyId },
        data: { serialId: serial.id }
      });

      return updated;
    });
  },

  returnSerial: async (data: {
    companyId: string;
    serialId: string;
    warehouseId: string;
    referenceType: string;
    referenceId: string;
    userId: string;
    remarks?: string;
  }) => {
    const serial = await prisma.inventorySerial.findFirst({
      where: { id: data.serialId, companyId: data.companyId }
    });
    if (!serial) throw new Error("Serial not found.");
    if (serial.status !== "SOLD") throw new Error("Only SOLD serials can be returned.");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.inventorySerial.update({
        where: { id: serial.id },
        data: { 
          status: "RETURNED", 
          warehouseId: data.warehouseId,
          soldDate: null, 
          assignedCustomerId: null,
          remarks: data.remarks
        }
      });

      await stockMovementService.recordMovement({
        companyId: data.companyId,
        productId: serial.productId,
        warehouseId: data.warehouseId,
        movementType: "RETURN_IN",
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        quantity: 1,
        remarks: data.remarks,
        performedById: data.userId
      });

      await tx.stockMovement.updateMany({
        where: { referenceType: data.referenceType, referenceId: data.referenceId, companyId: data.companyId },
        data: { serialId: serial.id }
      });

      return updated;
    });
  },

  repairSerial: async (id: string, companyId: string, remarks?: string) => {
    return prisma.inventorySerial.update({
      where: { id, companyId },
      data: { status: "REPAIRED", remarks }
    });
  },

  scrapSerial: async (data: {
    companyId: string;
    serialId: string;
    warehouseId: string;
    referenceType: string;
    referenceId: string;
    userId: string;
    remarks?: string;
  }) => {
    const serial = await serialService.validateSerial(data.companyId, data.serialId, data.warehouseId);
    
    return prisma.$transaction(async (tx) => {
      const updated = await tx.inventorySerial.update({
        where: { id: serial.id },
        data: { status: "SCRAPPED", remarks: data.remarks }
      });

      await stockMovementService.recordMovement({
        companyId: data.companyId,
        productId: serial.productId,
        warehouseId: data.warehouseId,
        movementType: "ADJUSTMENT_OUT",
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        quantity: -1,
        remarks: data.remarks,
        performedById: data.userId
      });

      await tx.stockMovement.updateMany({
        where: { referenceType: data.referenceType, referenceId: data.referenceId, companyId: data.companyId },
        data: { serialId: serial.id }
      });

      return updated;
    });
  },

  getSerialHistory: async (companyId: string, serialId: string) => {
    return prisma.stockMovement.findMany({
      where: { companyId, serialId },
      orderBy: { createdAt: "desc" },
      include: { performedBy: true, warehouse: true }
    });
  }
};
