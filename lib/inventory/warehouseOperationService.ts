import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Version 1.3 Phase 2B: Warehouse Operations Engine
 * Handles enterprise warehouse operational stock movements securely.
 */

export const warehouseOperationService = {

  validateWarehouseOperation: async (companyId: string, warehouseId: string, zoneId?: string, binId?: string) => {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId }
    });
    if (!warehouse) throw new Error("Warehouse not found or access denied.");
    if (!warehouse.isActive) throw new Error("Warehouse is inactive.");

    if (zoneId) {
      const zone = await prisma.warehouseZone.findFirst({
        where: { id: zoneId, warehouseId }
      });
      if (!zone) throw new Error("Zone not found in this warehouse.");
      if (!zone.isActive) throw new Error("Zone is inactive.");
    }

    if (binId) {
      const bin = await prisma.warehouseBin.findFirst({
        where: { id: binId, warehouseId }
      });
      if (!bin) throw new Error("Bin not found in this warehouse.");
      if (!bin.isActive) throw new Error("Bin is inactive.");
    }

    return true;
  },

  validateStockAvailability: async (companyId: string, productId: string, warehouseId: string, requiredQuantity: number | Decimal) => {
    const stock = await prisma.productWarehouse.findFirst({
      where: { companyId, productId, warehouseId }
    });

    if (!stock) throw new Error("Stock record not found.");
    
    const qty = new Decimal(stock.quantity as any);
    const reserved = new Decimal(stock.reservedQuantity as any);
    const available = qty.minus(reserved);
    const required = new Decimal(requiredQuantity);

    if (available.lessThan(required)) {
      throw new Error(`Insufficient available stock. Have ${available.toString()}, need ${required.toString()}`);
    }
    
    if (qty.lessThan(0)) {
       throw new Error("Negative stock state detected. Operation aborted.");
    }

    return true;
  },

  receiveStock: async (data: {
    companyId: string;
    warehouseId: string;
    productId: string;
    quantity: number | Decimal;
    binId?: string;
    referenceType?: string;
    referenceId?: string;
    userId: string;
  }) => {
    await warehouseOperationService.validateWarehouseOperation(data.companyId, data.warehouseId, undefined, data.binId);

    const existing = await prisma.productWarehouse.findFirst({
      where: { 
        companyId: data.companyId, 
        productId: data.productId, 
        warehouseId: data.warehouseId,
        ...(data.binId ? { binId: data.binId } : {})
      }
    });

    if (existing) {
      return prisma.productWarehouse.update({
        where: { id: existing.id },
        data: { quantity: { increment: data.quantity } }
      });
    } else {
      return prisma.productWarehouse.create({
        data: {
          companyId: data.companyId,
          productId: data.productId,
          warehouseId: data.warehouseId,
          binId: data.binId,
          quantity: data.quantity
        }
      });
    }
  },

  issueStock: async (data: {
    companyId: string;
    warehouseId: string;
    productId: string;
    quantity: number | Decimal;
    binId?: string;
    referenceType?: string;
    referenceId?: string;
    userId: string;
  }) => {
    await warehouseOperationService.validateWarehouseOperation(data.companyId, data.warehouseId, undefined, data.binId);
    await warehouseOperationService.validateStockAvailability(data.companyId, data.productId, data.warehouseId, data.quantity);

    // If stock is reserved for this specific issue, we would decrease reservedQuantity too.
    // For a standard unreserved issue:
    const stock = await prisma.productWarehouse.findFirst({
      where: { companyId: data.companyId, productId: data.productId, warehouseId: data.warehouseId }
    });

    return prisma.productWarehouse.update({
      where: { id: stock!.id },
      data: { quantity: { decrement: data.quantity } }
    });
  },

  reserveStock: async (data: {
    companyId: string;
    warehouseId: string;
    productId: string;
    quantity: number | Decimal;
  }) => {
    await warehouseOperationService.validateWarehouseOperation(data.companyId, data.warehouseId);
    await warehouseOperationService.validateStockAvailability(data.companyId, data.productId, data.warehouseId, data.quantity);

    const stock = await prisma.productWarehouse.findFirst({
      where: { companyId: data.companyId, productId: data.productId, warehouseId: data.warehouseId }
    });

    return prisma.productWarehouse.update({
      where: { id: stock!.id },
      data: { reservedQuantity: { increment: data.quantity } }
    });
  },

  releaseReservation: async (data: {
    companyId: string;
    warehouseId: string;
    productId: string;
    quantity: number | Decimal;
  }) => {
    const stock = await prisma.productWarehouse.findFirst({
      where: { companyId: data.companyId, productId: data.productId, warehouseId: data.warehouseId }
    });

    if (!stock) throw new Error("Stock not found.");

    const reserved = new Decimal(stock.reservedQuantity as any);
    const toRelease = new Decimal(data.quantity);

    if (reserved.lessThan(toRelease)) {
      throw new Error("Cannot release more than currently reserved.");
    }

    return prisma.productWarehouse.update({
      where: { id: stock.id },
      data: { reservedQuantity: { decrement: data.quantity } }
    });
  },

  transferStock: async (data: {
    companyId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    productId: string;
    quantity: number | Decimal;
    userId: string;
  }) => {
    await warehouseOperationService.validateWarehouseOperation(data.companyId, data.fromWarehouseId);
    await warehouseOperationService.validateWarehouseOperation(data.companyId, data.toWarehouseId);
    await warehouseOperationService.validateStockAvailability(data.companyId, data.productId, data.fromWarehouseId, data.quantity);

    return prisma.$transaction(async (tx) => {
      // Deduct from source
      const source = await tx.productWarehouse.findFirst({
        where: { companyId: data.companyId, productId: data.productId, warehouseId: data.fromWarehouseId }
      });
      await tx.productWarehouse.update({
        where: { id: source!.id },
        data: { quantity: { decrement: data.quantity } }
      });

      // Add to dest
      const dest = await tx.productWarehouse.findFirst({
        where: { companyId: data.companyId, productId: data.productId, warehouseId: data.toWarehouseId }
      });
      if (dest) {
        await tx.productWarehouse.update({
          where: { id: dest.id },
          data: { quantity: { increment: data.quantity } }
        });
      } else {
        await tx.productWarehouse.create({
          data: {
            companyId: data.companyId,
            productId: data.productId,
            warehouseId: data.toWarehouseId,
            quantity: data.quantity
          }
        });
      }
      return true;
    });
  },

  adjustStock: async (data: {
    companyId: string;
    warehouseId: string;
    productId: string;
    difference: number | Decimal;
    userId: string;
    reason: string;
  }) => {
    await warehouseOperationService.validateWarehouseOperation(data.companyId, data.warehouseId);
    const diff = new Decimal(data.difference);
    
    if (diff.isNegative()) {
      await warehouseOperationService.validateStockAvailability(data.companyId, data.productId, data.warehouseId, diff.abs());
    }

    const stock = await prisma.productWarehouse.findFirst({
      where: { companyId: data.companyId, productId: data.productId, warehouseId: data.warehouseId }
    });

    if (!stock) {
      if (diff.isNegative()) throw new Error("Cannot negatively adjust non-existent stock.");
      return prisma.productWarehouse.create({
        data: {
          companyId: data.companyId,
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: data.difference
        }
      });
    }

    return prisma.productWarehouse.update({
      where: { id: stock.id },
      data: { quantity: { increment: data.difference } }
    });
  },

  moveBetweenBins: async (data: {
    companyId: string;
    warehouseId: string;
    productId: string;
    fromBinId: string;
    toBinId: string;
    quantity: number | Decimal;
  }) => {
    // Basic structural bin to bin internal movement (Placeholder for atomic execution)
    throw new Error("Bin level transfers requiring internal lot isolation not fully implemented yet in Phase 2B.");
  },

  moveBetweenZones: async (data: {
    companyId: string;
    warehouseId: string;
    productId: string;
    fromZoneId: string;
    toZoneId: string;
    quantity: number | Decimal;
  }) => {
    throw new Error("Zone level transfers requiring internal lot isolation not fully implemented yet in Phase 2B.");
  }
};
