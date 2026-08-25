import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { DeliveryOrderStatus, SalesOrderStatus } from "@prisma/client";

/**
 * Validates a Delivery Order.
 */
export async function validateDelivery(companyId: string, data: any) {
  const salesOrder = await prisma.salesOrder.findFirst({
    where: { id: data.salesOrderId, companyId },
    include: { lines: true }
  });
  if (!salesOrder) throw new Error("Sales Order not found or does not belong to company");
  if (salesOrder.status === SalesOrderStatus.CANCELLED) {
    throw new Error("Cannot create delivery for a cancelled order");
  }

  const warehouseId = data.warehouseId || salesOrder.lines[0]?.warehouseId;
  if (!warehouseId) throw new Error("Warehouse is required for delivery");

  if (!data.lines || data.lines.length === 0) {
    throw new Error("Delivery Order must have at least one line item");
  }

  for (const line of data.lines) {
    const soLine = salesOrder.lines.find(sol => sol.id === line.salesOrderLineId || sol.productId === line.productId);
    if (!soLine) throw new Error(`Sales Order Line for product ${line.productId} not found`);

    if (line.batchId) {
      const batch = await prisma.inventoryBatch.findFirst({ where: { id: line.batchId } });
      if (!batch) throw new Error(`Batch ${line.batchId} not found`);
    }

    if (line.serialId) {
      const serial = await prisma.inventorySerial.findFirst({ where: { id: line.serialId } });
      if (!serial) throw new Error(`Serial ${line.serialId} not found`);
    }
  }

  return { valid: true };
}

/**
 * Generates a unique Delivery Order number.
 */
export async function generateDeliveryNumber(companyId: string): Promise<string> {
  const count = await prisma.deliveryOrder.count({ where: { companyId } });
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const nextNumber = (count + 1).toString().padStart(4, "0");
  return `DO-${dateStr}-${nextNumber}`;
}

/**
 * Creates a Delivery Order.
 */
export async function createDeliveryOrder(companyId: string, userId: string, data: any) {
  if (!data.deliveryNumber) {
    data.deliveryNumber = await generateDeliveryNumber(companyId);
  }

  await validateDelivery(companyId, data);

  const deliveryOrder = await prisma.deliveryOrder.create({
    data: {
      companyId,
      deliveryNumber: data.deliveryNumber,
      salesOrderId: data.salesOrderId,
      customerId: data.customerId,
      warehouseId: data.warehouseId,
      deliveryDate: data.deliveryDate || new Date(),
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      remarks: data.remarks,
      createdById: userId,
      lines: {
        create: data.lines.map((line: any) => ({
          salesOrderLineId: line.salesOrderLineId,
          productId: line.productId,
          batchId: line.batchId,
          serialId: line.serialId,
          quantity: line.quantity,
          warehouseId: data.warehouseId,
          zoneId: line.zoneId,
          binId: line.binId,
          remarks: line.remarks
        }))
      }
    },
    include: { lines: true }
  });

  await logAudit({
    module: "CRM",
    entityType: "DeliveryOrder",
    entityId: deliveryOrder.id,
    action: "CREATE",
    description: `Created Delivery Order ${deliveryOrder.deliveryNumber}`,
    afterValue: deliveryOrder,
  });

  return deliveryOrder;
}

/**
 * Approves a Delivery Order for Picking/Packing.
 */
export async function approveDeliveryOrder(companyId: string, id: string, userId: string) {
  const existing = await prisma.deliveryOrder.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Record not found or access denied");
    const deliveryOrder = await prisma.deliveryOrder.update({
      where: { id },
    data: { 
      status: DeliveryOrderStatus.APPROVED,
      approvedById: userId,
      approvedAt: new Date()
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "DeliveryOrder",
    entityId: id,
    action: "UPDATE",
    description: `Approved Delivery Order ${deliveryOrder.deliveryNumber}`,
  });

  return deliveryOrder;
}

/**
 * Converts a Sales Order directly to a DRAFT Delivery Order.
 */
export async function convertSalesOrder(companyId: string, salesOrderId: string, userId: string, extraData?: any) {
  const salesOrder = await prisma.salesOrder.findFirst({
    where: { id: salesOrderId, companyId },
    include: { lines: true }
  });

  if (!salesOrder) throw new Error("Sales Order not found");

  let primaryWarehouseId = salesOrder.lines.find(l => l.warehouseId)?.warehouseId;
  if (!primaryWarehouseId) {
    const defaultWh = await prisma.warehouse.findFirst({ where: { companyId } });
    primaryWarehouseId = defaultWh?.id;
  }
  if (!primaryWarehouseId) {
    const newWh = await prisma.warehouse.create({
      data: { companyId, code: "MAIN", name: "Main Warehouse" }
    });
    primaryWarehouseId = newWh.id;
  }

  const linesToDeliver = salesOrder.lines.map(line => ({
    salesOrderLineId: line.id,
    productId: line.productId,
    quantity: Number(line.quantity) || 1
  }));

  const deliveryData = {
    salesOrderId: salesOrder.id,
    customerId: salesOrder.customerId,
    warehouseId: primaryWarehouseId,
    carrier: extraData?.carrier || "Standard Shipping",
    trackingNumber: extraData?.trackingNumber || "",
    deliveryDate: extraData?.deliveryDate ? new Date(extraData.deliveryDate) : new Date(),
    remarks: extraData?.remarks || null,
    lines: linesToDeliver
  };

  return await createDeliveryOrder(companyId, userId, deliveryData);
}

/**
 * Releases reserved inventory back to pool from Sales Order lines.
 */
export async function releaseReservation(tx: any, deliveryOrderId: string) {
  const deliveryOrder = await tx.deliveryOrder.findUnique({
    where: { id: deliveryOrderId },
    include: { lines: true }
  });

  for (const line of deliveryOrder.lines) {
    const soLine = await tx.salesOrderLine.findUnique({ where: { id: line.salesOrderLineId } });
    if (soLine) {
      const newReserved = Math.max(0, Number(soLine.reservedQuantity) - Number(line.quantity));
      await tx.salesOrderLine.update({
        where: { id: soLine.id },
        data: { reservedQuantity: newReserved }
      });
    }
  }
}

/**
 * Creates Stock Movements, deducting physical stock.
 */

export async function createStockMovements(tx: any, companyId: string, deliveryOrder: any, userId: string) {
  for (const line of deliveryOrder.lines) {
    let pw = await tx.productWarehouse.findFirst({
      where: { companyId, productId: line.productId, warehouseId: line.warehouseId }
    });

    if (!pw) {
      pw = await tx.productWarehouse.create({
        data: {
          companyId,
          productId: line.productId,
          warehouseId: line.warehouseId,
          quantity: 0
        }
      });
    }

    const currentQty = Number(pw.quantity);
    const balanceAfter = currentQty - Number(line.quantity);

    // Create Stock Movement (OUT)
    await tx.stockMovement.create({
      data: {
        companyId,
        productId: line.productId,
        warehouseId: line.warehouseId,
        zoneId: line.zoneId,
        binId: line.binId,
        movementType: "OUT",
        referenceType: "DELIVERY_ORDER",
        referenceId: deliveryOrder.id,
        quantity: line.quantity,
        balanceAfter: balanceAfter,
        batchId: line.batchId,
        serialId: line.serialId,
        performedById: userId
      }
    });

    // Update Product Warehouse physical stock
    await tx.productWarehouse.update({
      where: { id: pw.id },
      data: { quantity: balanceAfter }
    });

    // Update Batch (if applicable)
    if (line.batchId) {
      const batch = await tx.inventoryBatch.findUnique({ where: { id: line.batchId } });
      if (batch) {
        await tx.inventoryBatch.update({
          where: { id: line.batchId },
          data: { quantity: Number(batch.quantity) - Number(line.quantity) }
        });
      }
    }

    // Update Serial (if applicable)
    if (line.serialId) {
      await tx.inventorySerial.update({
        where: { id: line.serialId },
        data: { status: "SOLD", soldDate: new Date(), assignedCustomerId: deliveryOrder.customerId }
      });
    }
  }
}

/**
 * Consumes FIFO Valuation Layers for COGS (Cost of Goods Sold).
 */
export async function consumeFIFO(tx: any, companyId: string, deliveryOrder: any) {
  for (const line of deliveryOrder.lines) {
    let remainingToConsume = Number(line.quantity);

    const layers = await tx.inventoryValuationLayer.findMany({
      where: {
        companyId,
        productId: line.productId,
        remainingQty: { gt: 0 }
      },
      orderBy: { receivedDate: 'asc' }
    });

    for (const layer of layers) {
      if (remainingToConsume <= 0) break;

      const layerQty = Number(layer.remainingQty);
      const consumed = Math.min(layerQty, remainingToConsume);

      await tx.inventoryValuationLayer.update({
        where: { id: layer.id },
        data: { remainingQty: layerQty - consumed }
      });

      remainingToConsume -= consumed;
    }
  }
}

/**
 * Ships the delivery. This is the critical step that reduces physical inventory,
 * creates stock movements, consumes FIFO, and releases the mathematical reservation.
 */
export async function shipDelivery(companyId: string, id: string, userId: string) {
  const existing = await prisma.deliveryOrder.findFirst({
    where: { id, companyId },
    include: { lines: true }
  });

  if (!existing || existing.status === DeliveryOrderStatus.SHIPPED || existing.status === DeliveryOrderStatus.DELIVERED) {
    throw new Error("Delivery is already shipped or delivered");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Release Reservation mathematically from Sales Order
    await releaseReservation(tx, id);

    // 2. Reduce Inventory & Create Stock Movements
    await createStockMovements(tx, companyId, existing, userId);

    // 3. Consume FIFO layers for valuation
    await consumeFIFO(tx, companyId, existing);

    // 4. Mark Delivery Order as SHIPPED
    await tx.deliveryOrder.update({
      where: { id },
      data: { status: DeliveryOrderStatus.SHIPPED }
    });
  });

  await logAudit({
    module: "CRM",
    entityType: "DeliveryOrder",
    entityId: id,
    action: "UPDATE",
    description: `Shipped Delivery Order ${existing.deliveryNumber}. Stock Movements created.`,
  });

  return await prisma.deliveryOrder.findUnique({ where: { id }, include: { lines: true } });
}

/**
 * Completes the delivery (Customer Received).
 */
export async function completeDelivery(companyId: string, id: string, userId: string) {
  const existing = await prisma.deliveryOrder.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Record not found or access denied");
    const delivery = await prisma.deliveryOrder.update({
      where: { id },
    data: { status: DeliveryOrderStatus.DELIVERED }
  });

  await logAudit({
    module: "CRM",
    entityType: "DeliveryOrder",
    entityId: id,
    action: "UPDATE",
    description: `Completed Delivery Order ${delivery.deliveryNumber}`,
  });

  return delivery;
}

/**
 * Cancels a Delivery Order.
 */
export async function cancelDelivery(companyId: string, id: string, userId: string) {
  const existing = await prisma.deliveryOrder.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Record not found or access denied");
  if (existing.status === DeliveryOrderStatus.SHIPPED || existing.status === DeliveryOrderStatus.DELIVERED) {
    throw new Error("Cannot cancel a shipped or delivered order.");
  }

  const delivery = await prisma.deliveryOrder.update({
    where: { id },
    data: { status: DeliveryOrderStatus.CANCELLED }
  });

  await logAudit({
    module: "CRM",
    entityType: "DeliveryOrder",
    entityId: id,
    action: "UPDATE",
    description: `Cancelled Delivery Order ${delivery.deliveryNumber}`,
  });

  return delivery;
}

/**
 * Retrieves delivery history.
 */
export async function getDeliveryHistory(companyId: string, id: string) {
  return await prisma.globalAuditLog.findMany({
    where: {
      companyId,
      module: "CRM",
      entityType: "DeliveryOrder",
      entityId: id,
    },
    orderBy: { createdAt: 'desc' }
  });
}
