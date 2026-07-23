import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { CustomerReturnStatus, ReturnCondition } from "@prisma/client";

/**
 * Generates a unique Return number.
 */
export async function generateReturnNumber(companyId: string): Promise<string> {
  const count = await prisma.customerReturn.count({ where: { companyId } });
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const nextNumber = (count + 1).toString().padStart(4, "0");
  return `RMA-${dateStr}-${nextNumber}`;
}

/**
 * Validates a Customer Return.
 */
export async function validateReturn(companyId: string, data: any) {
  const deliveryOrder = await prisma.deliveryOrder.findFirst({
    where: { id: data.deliveryOrderId, companyId },
    include: { lines: true }
  });
  if (!deliveryOrder) throw new Error("Delivery Order not found or does not belong to company");

  const customer = await prisma.customer.findFirst({ where: { id: data.customerId, companyId } });
  if (!customer) throw new Error("Customer not found");
  if (deliveryOrder.customerId !== customer.id) throw new Error("Customer mismatch with Delivery Order");

  const warehouse = await prisma.warehouse.findFirst({ where: { id: data.warehouseId, companyId } });
  if (!warehouse) throw new Error("Warehouse not found");

  if (!data.lines || data.lines.length === 0) {
    throw new Error("Customer Return must have at least one line item");
  }

  for (const line of data.lines) {
    const doLine = deliveryOrder.lines.find(dl => dl.id === line.deliveryOrderLineId);
    if (!doLine) throw new Error(`Delivery Order Line ${line.deliveryOrderLineId} not found`);

    if (Number(line.quantity) > Number(doLine.quantity)) {
      throw new Error(`Cannot return more than delivered quantity for product ${doLine.productId}`);
    }

    if (line.batchId && line.batchId !== doLine.batchId) {
      throw new Error(`Batch ID mismatch on return line ${line.id}`);
    }

    if (line.serialId && line.serialId !== doLine.serialId) {
      throw new Error(`Serial ID mismatch on return line ${line.id}`);
    }
  }

  return { valid: true };
}

/**
 * Creates a Customer Return.
 */
export async function createReturn(companyId: string, userId: string, data: any) {
  if (!data.returnNumber) {
    data.returnNumber = await generateReturnNumber(companyId);
  }

  await validateReturn(companyId, data);

  const customerReturn = await prisma.customerReturn.create({
    data: {
      companyId,
      returnNumber: data.returnNumber,
      deliveryOrderId: data.deliveryOrderId,
      customerId: data.customerId,
      warehouseId: data.warehouseId,
      returnDate: data.returnDate || new Date(),
      reason: data.reason,
      remarks: data.remarks,
      createdById: userId,
      lines: {
        create: data.lines.map((line: any) => ({
          deliveryOrderLineId: line.deliveryOrderLineId,
          productId: line.productId,
          batchId: line.batchId,
          serialId: line.serialId,
          quantity: line.quantity,
          returnCondition: line.returnCondition || ReturnCondition.GOOD,
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
    entityType: "CustomerReturn",
    entityId: customerReturn.id,
    action: "CREATE",
    description: `Created Customer Return ${customerReturn.returnNumber}`,
    afterValue: customerReturn,
  });

  return customerReturn;
}

/**
 * Approves a Customer Return.
 */
export async function approveReturn(companyId: string, id: string, userId: string) {
  const existing = await prisma.customerReturn.findFirst({ where: { id, companyId } });
  if (!existing || existing.status !== CustomerReturnStatus.DRAFT) {
    throw new Error("Only DRAFT returns can be approved");
  }

  const customerReturn = await prisma.customerReturn.update({
    where: { id, companyId },
    data: { 
      status: CustomerReturnStatus.APPROVED,
      approvedById: userId,
      approvedAt: new Date()
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "CustomerReturn",
    entityId: id,
    action: "UPDATE",
    description: `Approved Customer Return ${customerReturn.returnNumber}`,
  });

  return customerReturn;
}

/**
 * Begins inspection of a Customer Return.
 */
export async function inspectReturn(companyId: string, id: string, userId: string, inspectionRemarks?: string) {
  const existing = await prisma.customerReturn.findFirst({ where: { id, companyId } });
  if (!existing || (existing.status !== CustomerReturnStatus.APPROVED && existing.status !== CustomerReturnStatus.PENDING_APPROVAL)) {
    throw new Error("Return must be APPROVED before inspection");
  }

  const customerReturn = await prisma.customerReturn.update({
    where: { id, companyId },
    data: { 
      status: CustomerReturnStatus.INSPECTING,
      inspectionStatus: "STARTED",
      remarks: inspectionRemarks ? `${existing.remarks || ''}\nInspection: ${inspectionRemarks}` : existing.remarks
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "CustomerReturn",
    entityId: id,
    action: "UPDATE",
    description: `Started Inspection for Customer Return ${customerReturn.returnNumber}`,
  });

  return customerReturn;
}

/**
 * Internal method to handle stock movements for returns.
 */
export async function createStockMovements(tx: any, companyId: string, customerReturn: any, userId: string, movementType: "IN" | "ADJUSTMENT_IN") {
  for (const line of customerReturn.lines) {
    const pw = await tx.productWarehouse.findFirst({
      where: { companyId, productId: line.productId, warehouseId: line.warehouseId }
    });

    const currentQty = pw ? Number(pw.quantity) : 0;
    const balanceAfter = currentQty + Number(line.quantity);

    if (!pw) {
      // Create product warehouse if it doesn't exist
      await tx.productWarehouse.create({
        data: {
          companyId,
          productId: line.productId,
          warehouseId: line.warehouseId,
          quantity: balanceAfter
        }
      });
    } else {
      await tx.productWarehouse.update({
        where: { id: pw.id },
        data: { quantity: balanceAfter }
      });
    }

    await tx.stockMovement.create({
      data: {
        companyId,
        productId: line.productId,
        warehouseId: line.warehouseId,
        zoneId: line.zoneId,
        binId: line.binId,
        movementType,
        referenceType: "CUSTOMER_RETURN",
        referenceId: customerReturn.id,
        quantity: line.quantity,
        balanceAfter,
        batchId: line.batchId,
        serialId: line.serialId,
        performedById: userId
      }
    });

    if (line.batchId) {
      const batch = await tx.inventoryBatch.findUnique({ where: { id: line.batchId } });
      if (batch) {
        await tx.inventoryBatch.update({
          where: { id: line.batchId },
          data: { quantity: Number(batch.quantity) + Number(line.quantity) }
        });
      }
    }

    if (line.serialId) {
      await tx.inventorySerial.update({
        where: { id: line.serialId },
        data: { status: "RETURNED", assignedCustomerId: null }
      });
    }
  }
}

/**
 * Restores FIFO layers if items are returned in good condition.
 */
export async function restoreFIFO(tx: any, companyId: string, customerReturn: any) {
  for (const line of customerReturn.lines) {
    if (line.returnCondition === ReturnCondition.GOOD) {
      // Create a new valuation layer for the returned goods at the current moving average or original delivery cost.
      // Assuming a simplified restoration: we create a new layer as if it's a new receipt at $0 or original cost.
      // In a robust system, we would query the historical COGS for this exact delivery order line and restore at that cost.
      // For V1.3, we simulate a restored layer:
      await tx.inventoryValuationLayer.create({
        data: {
          companyId,
          productId: line.productId,
          warehouseId: line.warehouseId,
          receivedDate: new Date(),
          quantity: line.quantity,
          remainingQty: line.quantity,
          unitCost: 0, // Should be fetched from original COGS
          sourceType: "CUSTOMER_RETURN",
          sourceId: customerReturn.id
        }
      });
    }
  }
}

/**
 * Restocks inventory if goods are in GOOD condition.
 */
export async function restockInventory(companyId: string, id: string, userId: string) {
  const existing = await prisma.customerReturn.findFirst({
    where: { id, companyId },
    include: { lines: true }
  });

  if (!existing || existing.status !== CustomerReturnStatus.INSPECTING) {
    throw new Error("Only INSPECTING returns can be restocked");
  }

  // Ensure all lines are GOOD
  const hasBadCondition = existing.lines.some(l => l.returnCondition !== ReturnCondition.GOOD);
  if (hasBadCondition) {
    throw new Error("Cannot fully restock return with bad condition items. Scrap them or adjust lines.");
  }

  await prisma.$transaction(async (tx) => {
    await createStockMovements(tx, companyId, existing, userId, "IN");
    await restoreFIFO(tx, companyId, existing);
    
    await tx.customerReturn.update({
      where: { id },
      data: { status: CustomerReturnStatus.RESTOCKED }
    });
  });

  await logAudit({
    module: "CRM",
    entityType: "CustomerReturn",
    entityId: id,
    action: "UPDATE",
    description: `Restocked Customer Return ${existing.returnNumber}. Inventory updated.`,
  });

  return await prisma.customerReturn.findUnique({ where: { id }, include: { lines: true } });
}

/**
 * Scraps inventory if goods are damaged/defective.
 */
export async function scrapInventory(companyId: string, id: string, userId: string) {
  const existing = await prisma.customerReturn.findFirst({
    where: { id, companyId },
    include: { lines: true }
  });

  if (!existing || existing.status !== CustomerReturnStatus.INSPECTING) {
    throw new Error("Only INSPECTING returns can be scrapped");
  }

  await prisma.$transaction(async (tx) => {
    // Scrapping conceptually brings it in and immediately writes it off via Adjustment.
    // For simplicity in V1.3, we will just record an IN but immediately map it to a SCRAP area,
    // or just mark the return as SCRAPPED without restoring sellable stock.
    // We will NOT restore FIFO layers.
    
    // Create stock movement in, then immediate out adjustment
    await createStockMovements(tx, companyId, existing, userId, "IN");
    // Immediate out for scrap
    for (const line of existing.lines) {
      await tx.stockMovement.create({
        data: {
          companyId,
          productId: line.productId,
          warehouseId: line.warehouseId,
          movementType: "OUT",
          referenceType: "INVENTORY_ADJUSTMENT", // Simulating adjustment
          referenceId: existing.id,
          quantity: line.quantity,
          balanceAfter: 0, // Conceptual
          performedById: userId
        }
      });
      // Deduct from ProductWarehouse immediately
      const pw = await tx.productWarehouse.findFirst({
        where: { companyId, productId: line.productId, warehouseId: line.warehouseId }
      });
      if (pw) {
        await tx.productWarehouse.update({
          where: { id: pw.id },
          data: { quantity: Number(pw.quantity) - Number(line.quantity) }
        });
      }
    }

    await tx.customerReturn.update({
      where: { id },
      data: { status: CustomerReturnStatus.SCRAPPED }
    });
  });

  await logAudit({
    module: "CRM",
    entityType: "CustomerReturn",
    entityId: id,
    action: "UPDATE",
    description: `Scrapped Customer Return ${existing.returnNumber}. No sellable inventory added.`,
  });

  return await prisma.customerReturn.findUnique({ where: { id }, include: { lines: true } });
}

/**
 * Completes a Customer Return (typically post-restock/scrap).
 */
export async function completeReturn(companyId: string, id: string, userId: string) {
  const customerReturn = await prisma.customerReturn.update({
    where: { id, companyId },
    data: { status: CustomerReturnStatus.COMPLETED }
  });

  await logAudit({
    module: "CRM",
    entityType: "CustomerReturn",
    entityId: id,
    action: "UPDATE",
    description: `Completed Customer Return ${customerReturn.returnNumber}`,
  });

  return customerReturn;
}

/**
 * Cancels a Customer Return.
 */
export async function cancelReturn(companyId: string, id: string, userId: string) {
  const existing = await prisma.customerReturn.findUnique({ where: { id } });
  if (existing?.status === CustomerReturnStatus.RESTOCKED || existing?.status === CustomerReturnStatus.SCRAPPED || existing?.status === CustomerReturnStatus.COMPLETED) {
    throw new Error("Cannot cancel a processed return.");
  }

  const customerReturn = await prisma.customerReturn.update({
    where: { id, companyId },
    data: { status: CustomerReturnStatus.CANCELLED }
  });

  await logAudit({
    module: "CRM",
    entityType: "CustomerReturn",
    entityId: id,
    action: "UPDATE",
    description: `Cancelled Customer Return ${customerReturn.returnNumber}`,
  });

  return customerReturn;
}

/**
 * Retrieves return history.
 */
export async function getReturnHistory(companyId: string, id: string) {
  return await prisma.globalAuditLog.findMany({
    where: {
      companyId,
      module: "CRM",
      entityType: "CustomerReturn",
      entityId: id,
    },
    orderBy: { createdAt: 'desc' }
  });
}
