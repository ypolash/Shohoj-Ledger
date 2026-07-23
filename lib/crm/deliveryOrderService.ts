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
  if (salesOrder.status !== SalesOrderStatus.OPEN && salesOrder.status !== SalesOrderStatus.PARTIALLY_DELIVERED) {
    throw new Error("Sales Order must be OPEN to create a delivery");
  }

  const warehouse = await prisma.warehouse.findFirst({ where: { id: data.warehouseId, companyId } });
  if (!warehouse) throw new Error("Warehouse not found");

  if (!data.lines || data.lines.length === 0) {
    throw new Error("Delivery Order must have at least one line item");
  }

  for (const line of data.lines) {
    const soLine = salesOrder.lines.find(sol => sol.id === line.salesOrderLineId);
    if (!soLine) throw new Error(`Sales Order Line ${line.salesOrderLineId} not found in this Sales Order`);

    if (Number(line.quantity) > Number(soLine.reservedQuantity)) {
      throw new Error(`Cannot deliver more than reserved quantity for product ${soLine.productId}`);
    }

    if (line.batchId) {
      const batch = await prisma.inventoryBatch.findFirst({ where: { id: line.batchId, warehouseId: data.warehouseId } });
      if (!batch) throw new Error(`Batch ${line.batchId} not found in warehouse ${data.warehouseId}`);
    }

    if (line.serialId) {
      const serial = await prisma.inventorySerial.findFirst({ where: { id: line.serialId, warehouseId: data.warehouseId } });
      if (!serial) throw new Error(`Serial ${line.serialId} not found in warehouse ${data.warehouseId}`);
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
  const deliveryOrder = await prisma.deliveryOrder.update({
    where: { id, companyId },
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
export async function convertSalesOrder(companyId: string, salesOrderId: string, userId: string) {
  const salesOrder = await prisma.salesOrder.findFirst({
    where: { id: salesOrderId, companyId, status: SalesOrderStatus.OPEN },
    include: { lines: true }
  });

  if (!salesOrder) throw new Error("Sales Order not found or not in OPEN status");

  // Determine warehouse from the first line (assuming single warehouse per delivery for simplicity, or grouping)
  const primaryWarehouseId = salesOrder.lines[0]?.warehouseId;
  if (!primaryWarehouseId) throw new Error("Sales Order lines must have a warehouse assigned");

  const deliveryData = {
    salesOrderId: salesOrder.id,
    customerId: salesOrder.customerId,
    warehouseId: primaryWarehouseId,
    lines: salesOrder.lines.filter(l => Number(l.reservedQuantity) > 0).map(line => ({
      salesOrderLineId: line.id,
      productId: line.productId,
      quantity: line.reservedQuantity, // default to fulfilling full reserved amount
    }))
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
    // 1. Determine Product Warehouse Record
    const pw = await tx.productWarehouse.findFirst({
      where: { companyId, productId: line.productId, warehouseId: line.warehouseId }
    });

    const currentQty = pw ? Number(pw.quantity) : 0;
    const balanceAfter = currentQty - Number(line.quantity);

    if (balanceAfter < 0) {
      throw new Error(`Insufficient stock for product ${line.productId} in warehouse ${line.warehouseId}`);
    }

    // 2. Create Stock Movement (OUT)
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

    // 3. Update Product Warehouse physical stock
    await tx.productWarehouse.update({
      where: { id: pw.id },
      data: { quantity: balanceAfter }
    });

    // 4. Update Batch (if applicable)
    if (line.batchId) {
      const batch = await tx.inventoryBatch.findUnique({ where: { id: line.batchId } });
      await tx.inventoryBatch.update({
        where: { id: line.batchId },
        data: { quantity: Number(batch.quantity) - Number(line.quantity) }
      });
    }

    // 5. Update Serial (if applicable)
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

    // Fetch available FIFO layers ordered by receivedDate ASC
    const layers = await tx.inventoryValuationLayer.findMany({
      where: {
        companyId,
        productId: line.productId,
        remainingQty: { gt: 0 }
      },
      orderBy: { receivedDate: 'asc' }
    });

    let totalCogs = 0;

    for (const layer of layers) {
      if (remainingToConsume <= 0) break;

      const layerQty = Number(layer.remainingQty);
      const consumed = Math.min(layerQty, remainingToConsume);

      await tx.inventoryValuationLayer.update({
        where: { id: layer.id },
        data: { remainingQty: layerQty - consumed }
      });

      totalCogs += consumed * Number(layer.unitCost);
      remainingToConsume -= consumed;
    }

    if (remainingToConsume > 0) {
      throw new Error(`Insufficient FIFO layers to consume for product ${line.productId}`);
    }

    // Note: COGS logic is recorded here mathematically. Actual Journal Entries for COGS 
    // are NOT created here, per project rules. They will be generated in Phase 3H (Invoice).
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
  const delivery = await prisma.deliveryOrder.update({
    where: { id, companyId },
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
  const existing = await prisma.deliveryOrder.findUnique({ where: { id } });
  if (existing?.status === DeliveryOrderStatus.SHIPPED || existing?.status === DeliveryOrderStatus.DELIVERED) {
    throw new Error("Cannot cancel a shipped or delivered order.");
  }

  const delivery = await prisma.deliveryOrder.update({
    where: { id, companyId },
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
