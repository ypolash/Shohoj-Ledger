import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Version 1.3 Phase 2M: Enterprise Inventory Valuation Engine
 * The single source of truth for Asset Value and Cost of Goods Sold (COGS).
 * Currently implements strict FIFO.
 */

export const valuationService = {

  validateValuation: async (companyId: string, layerId: string) => {
    const layer = await prisma.inventoryValuationLayer.findFirst({
      where: { id: layerId, companyId }
    });
    if (!layer) throw new Error("Valuation layer not found.");
    return layer;
  },

  /**
   * Called automatically when stock is received into the warehouse (Goods Receipt, Transfer In, Positive Adjustment)
   */
  createLayer: async (data: {
    companyId: string;
    productId: string;
    warehouseId?: string;
    stockMovementId?: string;
    layerType: "RECEIPT" | "ADJUSTMENT_IN" | "INITIAL_STOCK";
    quantity: number | Decimal;
    unitCost: number | Decimal;
  }) => {
    const qty = new Decimal(data.quantity);
    const cost = new Decimal(data.unitCost);

    if (qty.lessThanOrEqualTo(0)) throw new Error("Layer quantity must be greater than zero.");
    if (cost.lessThan(0)) throw new Error("Unit cost cannot be negative.");

    return prisma.inventoryValuationLayer.create({
      data: {
        companyId: data.companyId,
        productId: data.productId,
        warehouseId: data.warehouseId,
        stockMovementId: data.stockMovementId,
        layerType: data.layerType,
        quantity: qty,
        remainingQuantity: qty,
        unitCost: cost,
        totalCost: qty.mul(cost),
        valuationMethod: "FIFO" // Enforced as standard
      }
    });
  },

  /**
   * Called automatically when stock leaves the warehouse (Picking, Transfer Out, Negative Adjustment, Scrap)
   * Implements strict FIFO consumption logic.
   */
  consumeLayer: async (data: {
    companyId: string;
    productId: string;
    warehouseId?: string;
    quantityToConsume: number | Decimal;
  }) => {
    const reqQty = new Decimal(data.quantityToConsume);
    if (reqQty.lessThanOrEqualTo(0)) throw new Error("Quantity to consume must be greater than zero.");

    // Retrieve active FIFO layers (oldest first)
    const layers = await prisma.inventoryValuationLayer.findMany({
      where: {
        companyId: data.companyId,
        productId: data.productId,
        warehouseId: data.warehouseId,
        remainingQuantity: { gt: 0 }
      },
      orderBy: { createdAt: "asc" } // Core FIFO behavior
    });

    let remainingToConsume = reqQty;
    let totalCOGS = new Decimal(0);
    const consumedDetails: { layerId: string; consumedQty: Decimal; unitCost: Decimal; layerCOGS: Decimal }[] = [];

    return prisma.$transaction(async (tx) => {
      for (const layer of layers) {
        if (remainingToConsume.equals(0)) break;

        const available = new Decimal(layer.remainingQuantity as any);
        const toTake = Decimal.min(available, remainingToConsume);

        const layerCOGS = toTake.mul(new Decimal(layer.unitCost as any));
        totalCOGS = totalCOGS.plus(layerCOGS);

        // Update layer
        await tx.inventoryValuationLayer.update({
          where: { id: layer.id },
          data: { remainingQuantity: available.minus(toTake) }
        });

        consumedDetails.push({
          layerId: layer.id,
          consumedQty: toTake,
          unitCost: new Decimal(layer.unitCost as any),
          layerCOGS
        });

        remainingToConsume = remainingToConsume.minus(toTake);
      }

      if (remainingToConsume.greaterThan(0)) {
        throw new Error(`Negative inventory prevention: Insufficient valuation layers to consume ${reqQty.toString()} units. Missing ${remainingToConsume.toString()} units.`);
      }

      return { totalCOGS, consumedDetails };
    });
  },

  calculateCOGS: async (companyId: string, productId: string, quantity: number | Decimal, warehouseId?: string) => {
    // Non-mutating simulation of consumeLayer for quoting/reporting purposes
    const reqQty = new Decimal(quantity);
    const layers = await prisma.inventoryValuationLayer.findMany({
      where: {
        companyId,
        productId,
        warehouseId,
        remainingQuantity: { gt: 0 }
      },
      orderBy: { createdAt: "asc" }
    });

    let remaining = reqQty;
    let estimatedCOGS = new Decimal(0);

    for (const layer of layers) {
      if (remaining.equals(0)) break;
      const available = new Decimal(layer.remainingQuantity as any);
      const toTake = Decimal.min(available, remaining);
      estimatedCOGS = estimatedCOGS.plus(toTake.mul(new Decimal(layer.unitCost as any)));
      remaining = remaining.minus(toTake);
    }

    if (remaining.greaterThan(0)) {
       // Cannot fully calculate, inventory would go negative. Return cost for what is available, or throw.
       throw new Error("Insufficient stock to calculate precise COGS.");
    }

    return estimatedCOGS;
  },

  calculateInventoryValue: async (companyId: string, warehouseId?: string) => {
    const layers = await prisma.inventoryValuationLayer.findMany({
      where: {
        companyId,
        ...(warehouseId ? { warehouseId } : {}),
        remainingQuantity: { gt: 0 }
      }
    });

    return layers.reduce((acc, layer) => {
      const remaining = new Decimal(layer.remainingQuantity as any);
      const cost = new Decimal(layer.unitCost as any);
      return acc.plus(remaining.mul(cost));
    }, new Decimal(0));
  },

  getProductValuation: async (companyId: string, productId: string) => {
    const layers = await prisma.inventoryValuationLayer.findMany({
      where: { companyId, productId, remainingQuantity: { gt: 0 } }
    });

    let totalQuantity = new Decimal(0);
    let totalValue = new Decimal(0);

    layers.forEach(l => {
      const qty = new Decimal(l.remainingQuantity as any);
      totalQuantity = totalQuantity.plus(qty);
      totalValue = totalValue.plus(qty.mul(new Decimal(l.unitCost as any)));
    });

    const averageCost = totalQuantity.greaterThan(0) ? totalValue.dividedBy(totalQuantity) : new Decimal(0);

    return { totalQuantity, totalValue, averageCost };
  },

  getWarehouseValuation: async (companyId: string, warehouseId: string) => {
    return valuationService.calculateInventoryValue(companyId, warehouseId);
  },

  /**
   * Enterprise Disaster Recovery: Rebuilds valuation layers by chronologically replaying all Stock Movements.
   */
  recalculateProduct: async (companyId: string, productId: string) => {
    throw new Error("recalculateProduct: Fully atomic replay logic requires Phase 2N coordination. Method stubbed.");
  },

  rebuildValuation: async (companyId: string) => {
    throw new Error("rebuildValuation: System-wide replay logic stubbed. Use sparingly.");
  }
};
