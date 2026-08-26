import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { SalesOrderStatus } from "@prisma/client";
import { productWarehouseService } from "@/lib/inventory/productWarehouseService";

/**
 * Approves a Sales Order.
 */
export async function approveSalesOrder(companyId: string, id: string, userId: string) {
  const existing = await prisma.salesOrder.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Record not found or access denied");
    const salesOrder = await prisma.salesOrder.update({
      where: { id },
    data: { 
      status: SalesOrderStatus.APPROVED,
      approvedById: userId,
      approvedAt: new Date()
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "SalesOrder",
    entityId: id,
    action: "UPDATE",
    description: `Approved Sales Order ${salesOrder.salesOrderNumber}`,
  });

  return salesOrder;
}

/**
 * Reserves inventory for a Sales Order, moving it to OPEN status.
 * This explicitly DOES NOT generate Stock Movements or Journal Entries.
 * It strictly tracks reserved stock mathematically.
 */
export async function reserveInventory(companyId: string, id: string, userId: string) {
  const existing = await prisma.salesOrder.findFirst({ 
    where: { id, companyId },
    include: { lines: true }
  });
  
  if (!existing || existing.status !== SalesOrderStatus.APPROVED) {
    throw new Error("Only APPROVED Sales Orders can reserve inventory");
  }

  // Iterate over lines and mark quantity as reserved
  // Do this sequentially to allow productWarehouseService to validate and reserve
  for (const line of existing.lines) {
    if (Number(line.quantity) > 0) {
      await productWarehouseService.reserveStock(
        companyId, 
        line.productId, 
        line.warehouseId, 
        Number(line.quantity)
      );
      
      await prisma.salesOrderLine.update({
        where: { id: line.id },
        data: { reservedQuantity: line.quantity }
      });
    }
  }

  await prisma.salesOrder.update({
    where: { id },
    data: { status: SalesOrderStatus.OPEN }
  });

  await logAudit({
    module: "CRM",
    entityType: "SalesOrder",
    entityId: id,
    action: "UPDATE",
    description: `Reserved Inventory and opened Sales Order ${existing.salesOrderNumber}`,
  });

  return await prisma.salesOrder.findUnique({ where: { id }, include: { lines: true } });
}

/**
 * Releases reserved inventory for a Sales Order.
 */
export async function releaseReservation(companyId: string, id: string, userId: string) {
  const existing = await prisma.salesOrder.findFirst({ 
    where: { id, companyId },
    include: { lines: true }
  });
  
  if (!existing || existing.status === SalesOrderStatus.CLOSED || existing.status === SalesOrderStatus.DELIVERED) {
    throw new Error("Cannot release reservation for completed orders");
  }

  for (const line of existing.lines) {
    if (Number(line.reservedQuantity) > 0) {
      await productWarehouseService.releaseStock(
        companyId,
        line.productId,
        line.warehouseId,
        Number(line.reservedQuantity)
      );

      await prisma.salesOrderLine.update({
        where: { id: line.id },
        data: { reservedQuantity: 0 }
      });
    }
  }

  await logAudit({
    module: "CRM",
    entityType: "SalesOrder",
    entityId: id,
    action: "UPDATE",
    description: `Released Inventory reservations for Sales Order ${existing.salesOrderNumber}`,
  });

  return true;
}

/**
 * Cancels a Sales Order and automatically releases any reservations.
 */
export async function cancelSalesOrder(companyId: string, id: string, userId: string) {
  await releaseReservation(companyId, id, userId);

  const existing = await prisma.salesOrder.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Record not found or access denied");
    const salesOrder = await prisma.salesOrder.update({
      where: { id },
    data: { status: SalesOrderStatus.CANCELLED }
  });

  await logAudit({
    module: "CRM",
    entityType: "SalesOrder",
    entityId: id,
    action: "UPDATE",
    description: `Cancelled Sales Order ${salesOrder.salesOrderNumber}`,
  });

  return salesOrder;
}

/**
 * Closes a Sales Order (usually after final delivery/invoicing).
 */
export async function closeSalesOrder(companyId: string, id: string, userId: string) {
  const existing = await prisma.salesOrder.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Record not found or access denied");
    const salesOrder = await prisma.salesOrder.update({
      where: { id },
    data: { status: SalesOrderStatus.CLOSED }
  });

  await logAudit({
    module: "CRM",
    entityType: "SalesOrder",
    entityId: id,
    action: "UPDATE",
    description: `Closed Sales Order ${salesOrder.salesOrderNumber}`,
  });

  return salesOrder;
}
