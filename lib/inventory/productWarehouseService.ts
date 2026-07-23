import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const productWarehouseService = {
  getStock: async (companyId: string, productId: string, warehouseId?: string) => {
    return prisma.productWarehouse.findMany({
      where: {
        companyId,
        productId,
        ...(warehouseId && { warehouseId })
      },
      include: {
        warehouse: true,
        bin: true
      }
    });
  },

  reserveStock: async (companyId: string, productId: string, warehouseId: string, quantityToReserve: number | Decimal) => {
    const stock = await prisma.productWarehouse.findFirst({
      where: { companyId, productId, warehouseId }
    });

    if (!stock) throw new Error("Stock record not found for this product/warehouse combination.");

    const available = (stock.quantity as Decimal).minus(stock.reservedQuantity as Decimal);
    if (available.lessThan(quantityToReserve)) {
      throw new Error(`Insufficient available stock. Have ${available.toString()}, need ${quantityToReserve.toString()}`);
    }

    return prisma.productWarehouse.update({
      where: { id: stock.id },
      data: {
        reservedQuantity: { increment: quantityToReserve }
      }
    });
  },

  releaseStock: async (companyId: string, productId: string, warehouseId: string, quantityToRelease: number | Decimal) => {
    const stock = await prisma.productWarehouse.findFirst({
      where: { companyId, productId, warehouseId }
    });

    if (!stock) throw new Error("Stock record not found.");

    return prisma.productWarehouse.update({
      where: { id: stock.id },
      data: {
        reservedQuantity: { decrement: quantityToRelease }
      }
    });
  },

  moveStock: async (
    companyId: string, 
    productId: string, 
    fromWarehouseId: string, 
    toWarehouseId: string, 
    quantity: number | Decimal
  ) => {
    return prisma.$transaction(async (tx) => {
      // 1. Deduct from source
      const source = await tx.productWarehouse.updateMany({
        where: { companyId, productId, warehouseId: fromWarehouseId },
        data: { quantity: { decrement: quantity } }
      });

      if (source.count === 0) throw new Error("Source stock not found.");

      // 2. Add to destination
      const dest = await tx.productWarehouse.findFirst({
        where: { companyId, productId, warehouseId: toWarehouseId }
      });

      if (dest) {
        await tx.productWarehouse.update({
          where: { id: dest.id },
          data: { quantity: { increment: quantity } }
        });
      } else {
        await tx.productWarehouse.create({
          data: {
            companyId,
            productId,
            warehouseId: toWarehouseId,
            quantity
          }
        });
      }

      return true;
    });
  },

  adjustStock: async (
    companyId: string, 
    productId: string, 
    warehouseId: string, 
    difference: number | Decimal // Can be positive or negative
  ) => {
    const existing = await prisma.productWarehouse.findFirst({
      where: { companyId, productId, warehouseId }
    });

    if (!existing) {
      // If positive adjust, create it
      return prisma.productWarehouse.create({
        data: {
          companyId,
          productId,
          warehouseId,
          quantity: difference
        }
      });
    }

    return prisma.productWarehouse.update({
      where: { id: existing.id },
      data: {
        quantity: { increment: difference }
      }
    });
  }
};
