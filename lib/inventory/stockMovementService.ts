import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Version 1.3 Phase 2C: Stock Movement Engine
 * The centralized gateway for ALL physical and logical inventory quantity changes.
 * Every operation writes to StockMovement for an immutable audit trail.
 */

export const stockMovementService = {

  validateMovement: async (
    companyId: string, 
    warehouseId: string, 
    productId: string, 
    zoneId?: string, 
    binId?: string
  ) => {
    const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, companyId } });
    if (!warehouse) throw new Error("Warehouse not found or access denied.");
    if (!warehouse.isActive) throw new Error("Warehouse is inactive.");

    const product = await prisma.product.findFirst({ where: { id: productId, companyId } });
    if (!product) throw new Error("Product not found or access denied.");

    if (zoneId) {
      const zone = await prisma.warehouseZone.findFirst({ where: { id: zoneId, warehouseId } });
      if (!zone) throw new Error("Zone not found.");
      if (!zone.isActive) throw new Error("Zone is inactive.");
    }

    if (binId) {
      const bin = await prisma.warehouseBin.findFirst({ where: { id: binId, warehouseId } });
      if (!bin) throw new Error("Bin not found.");
      if (!bin.isActive) throw new Error("Bin is inactive.");
    }
  },

  recordMovement: async (data: {
    companyId: string;
    productId: string;
    warehouseId: string;
    zoneId?: string;
    binId?: string;
    movementType: string;
    referenceType: string;
    referenceId: string;
    quantity: number | Decimal;
    unitCost?: number | Decimal;
    remarks?: string;
    performedById: string;
  }) => {
    await stockMovementService.validateMovement(
      data.companyId, 
      data.warehouseId, 
      data.productId, 
      data.zoneId, 
      data.binId
    );

    return prisma.$transaction(async (tx) => {
      let stock = await tx.productWarehouse.findFirst({
        where: {
          companyId: data.companyId,
          productId: data.productId,
          warehouseId: data.warehouseId
        }
      });

      const qty = new Decimal(data.quantity);
      
      // Prevent negative stock on decrements
      if (qty.isNegative()) {
        if (!stock) throw new Error("Cannot decrement non-existent stock.");
        const available = new Decimal(stock.quantity as any).minus(new Decimal(stock.reservedQuantity as any));
        if (available.plus(qty).isNegative()) { // qty is negative, so this acts as subtraction
          throw new Error("Insufficient stock for this movement.");
        }
      }

      if (stock) {
        stock = await tx.productWarehouse.update({
          where: { id: stock.id },
          data: { quantity: { increment: qty } }
        });
      } else {
        if (qty.isNegative()) throw new Error("Cannot decrement non-existent stock.");
        stock = await tx.productWarehouse.create({
          data: {
            companyId: data.companyId,
            productId: data.productId,
            warehouseId: data.warehouseId,
            quantity: qty
          }
        });
      }

      // Record Audit
      await tx.stockMovement.create({
        data: {
          companyId: data.companyId,
          productId: data.productId,
          warehouseId: data.warehouseId,
          zoneId: data.zoneId,
          binId: data.binId,
          movementType: data.movementType,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          quantity: qty,
          unitCost: data.unitCost ? new Decimal(data.unitCost) : null,
          balanceAfter: stock.quantity as Decimal,
          remarks: data.remarks,
          performedById: data.performedById
        }
      });

      return stock;
    });
  },

  receive: async (data: any) => stockMovementService.recordMovement({ ...data, movementType: "RECEIVE" }),
  
  issue: async (data: any) => stockMovementService.recordMovement({ ...data, quantity: new Decimal(data.quantity).negated(), movementType: "ISSUE" }),
  
  transfer: async (data: {
    companyId: string;
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    referenceType: string;
    referenceId: string;
    quantity: number | Decimal;
    performedById: string;
  }) => {
    // Requires a unified transaction for both sides
    const qty = new Decimal(data.quantity);
    if (qty.isNegative()) throw new Error("Transfer quantity must be positive.");

    await stockMovementService.recordMovement({
      companyId: data.companyId,
      productId: data.productId,
      warehouseId: data.fromWarehouseId,
      movementType: "TRANSFER_OUT",
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      quantity: qty.negated(),
      performedById: data.performedById
    });

    await stockMovementService.recordMovement({
      companyId: data.companyId,
      productId: data.productId,
      warehouseId: data.toWarehouseId,
      movementType: "TRANSFER_IN",
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      quantity: qty,
      performedById: data.performedById
    });

    return true;
  },

  reserve: async (data: any) => {
    return prisma.$transaction(async (tx) => {
      const stock = await tx.productWarehouse.findFirst({
        where: { companyId: data.companyId, productId: data.productId, warehouseId: data.warehouseId }
      });
      if (!stock) throw new Error("Stock not found.");

      const available = new Decimal(stock.quantity as any).minus(new Decimal(stock.reservedQuantity as any));
      const required = new Decimal(data.quantity);
      if (available.lessThan(required)) throw new Error("Insufficient stock to reserve.");

      const updated = await tx.productWarehouse.update({
        where: { id: stock.id },
        data: { reservedQuantity: { increment: required } }
      });

      await tx.stockMovement.create({
        data: {
          companyId: data.companyId,
          productId: data.productId,
          warehouseId: data.warehouseId,
          movementType: "RESERVE",
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          quantity: 0, // Physical quantity does not change
          balanceAfter: updated.quantity as Decimal,
          remarks: `Reserved ${required.toString()}`,
          performedById: data.performedById
        }
      });
      return updated;
    });
  },

  release: async (data: any) => {
    return prisma.$transaction(async (tx) => {
      const stock = await tx.productWarehouse.findFirst({
        where: { companyId: data.companyId, productId: data.productId, warehouseId: data.warehouseId }
      });
      if (!stock) throw new Error("Stock not found.");

      const reserved = new Decimal(stock.reservedQuantity as any);
      const toRelease = new Decimal(data.quantity);
      if (reserved.lessThan(toRelease)) throw new Error("Cannot release more than reserved.");

      const updated = await tx.productWarehouse.update({
        where: { id: stock.id },
        data: { reservedQuantity: { decrement: toRelease } }
      });

      await tx.stockMovement.create({
        data: {
          companyId: data.companyId,
          productId: data.productId,
          warehouseId: data.warehouseId,
          movementType: "RELEASE",
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          quantity: 0, // Physical quantity does not change
          balanceAfter: updated.quantity as Decimal,
          remarks: `Released ${toRelease.toString()}`,
          performedById: data.performedById
        }
      });
      return updated;
    });
  },

  adjust: async (data: any) => {
    const qty = new Decimal(data.quantity);
    const movementType = qty.isNegative() ? "ADJUSTMENT_OUT" : "ADJUSTMENT_IN";
    return stockMovementService.recordMovement({ ...data, movementType });
  },

  reverseMovement: async (id: string, companyId: string, performedById: string) => {
    const original = await prisma.stockMovement.findFirst({ where: { id, companyId } });
    if (!original) throw new Error("Movement not found.");

    let reverseType = "COUNT_CORRECTION";
    if (original.movementType === "RECEIVE") reverseType = "RETURN_OUT";
    if (original.movementType === "ISSUE") reverseType = "RETURN_IN";

    return stockMovementService.recordMovement({
      companyId,
      productId: original.productId,
      warehouseId: original.warehouseId,
      zoneId: original.zoneId || undefined,
      binId: original.binId || undefined,
      movementType: reverseType,
      referenceType: "REVERSAL",
      referenceId: original.id,
      quantity: new Decimal(original.quantity as any).negated(),
      performedById,
      remarks: `Reversal of movement ${original.id}`
    });
  },

  getMovementHistory: async (companyId: string, filters?: any) => {
    return prisma.stockMovement.findMany({
      where: { companyId, ...filters },
      orderBy: { createdAt: "desc" },
      include: { product: true, warehouse: true, performedBy: true }
    });
  },

  getProductHistory: async (companyId: string, productId: string) => {
    return stockMovementService.getMovementHistory(companyId, { productId });
  },

  getWarehouseHistory: async (companyId: string, warehouseId: string) => {
    return stockMovementService.getMovementHistory(companyId, { warehouseId });
  }
};
