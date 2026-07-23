import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { SalesOrderStatus } from "@prisma/client";

/**
 * Validates a Sales Order.
 */
export async function validateSalesOrder(companyId: string, data: any) {
  const customer = await prisma.customer.findFirst({ where: { id: data.customerId, companyId } });
  if (!customer) throw new Error("Customer not found or does not belong to company");

  if (data.quotationId) {
    const quotation = await prisma.quotation.findFirst({ where: { id: data.quotationId, companyId } });
    if (!quotation) throw new Error("Quotation not found or does not belong to company");
  }

  if (!data.lines || data.lines.length === 0) {
    throw new Error("Sales Order must have at least one line item");
  }

  for (const line of data.lines) {
    const product = await prisma.product.findFirst({ where: { id: line.productId, companyId } });
    if (!product) throw new Error(`Product ${line.productId} not found`);

    if (!line.warehouseId) throw new Error(`Warehouse is required for product ${line.productId}`);
    const warehouse = await prisma.warehouse.findFirst({ where: { id: line.warehouseId, companyId } });
    if (!warehouse) throw new Error(`Warehouse ${line.warehouseId} not found`);
  }

  return { valid: true };
}

/**
 * Generates a unique Sales Order number.
 */
export async function generateSalesOrderNumber(companyId: string): Promise<string> {
  const count = await prisma.salesOrder.count({ where: { companyId } });
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const nextNumber = (count + 1).toString().padStart(4, "0");
  return `SO-${dateStr}-${nextNumber}`;
}

/**
 * Calculates totals for a Sales Order.
 */
export function calculateTotals(lines: any[], globalDiscount: number = 0, globalShipping: number = 0) {
  let subtotal = 0;
  let taxAmount = 0;

  const processedLines = lines.map(line => {
    const qty = Number(line.quantity);
    const price = Number(line.unitPrice);
    const discPct = Number(line.discountPercent || 0);
    const taxPct = Number(line.taxPercent || 0);

    const grossLineTotal = qty * price;
    const discountAmt = grossLineTotal * (discPct / 100);
    const lineSubtotal = grossLineTotal - discountAmt;
    const lineTaxAmt = lineSubtotal * (taxPct / 100);
    const lineTotal = lineSubtotal + lineTaxAmt;

    subtotal += lineSubtotal;
    taxAmount += lineTaxAmt;

    return {
      ...line,
      discountAmount: discountAmt,
      taxAmount: lineTaxAmt,
      lineTotal
    };
  });

  const totalAmount = subtotal + taxAmount + globalShipping - globalDiscount;

  return {
    subtotal,
    taxAmount,
    shippingAmount: globalShipping,
    discountAmount: globalDiscount,
    totalAmount,
    processedLines
  };
}

/**
 * Creates a new Sales Order.
 */
export async function createSalesOrder(companyId: string, userId: string, data: any) {
  if (!data.salesOrderNumber) {
    data.salesOrderNumber = await generateSalesOrderNumber(companyId);
  }

  await validateSalesOrder(companyId, data);

  const { subtotal, taxAmount, shippingAmount, discountAmount, totalAmount, processedLines } = calculateTotals(
    data.lines, 
    Number(data.discountAmount || 0), 
    Number(data.shippingAmount || 0)
  );

  const salesOrder = await prisma.salesOrder.create({
    data: {
      companyId,
      salesOrderNumber: data.salesOrderNumber,
      quotationId: data.quotationId,
      customerId: data.customerId,
      orderDate: data.orderDate || new Date(),
      requestedDeliveryDate: data.requestedDeliveryDate,
      currency: data.currency || "BDT",
      subtotal,
      taxAmount,
      shippingAmount,
      discountAmount,
      totalAmount,
      remarks: data.remarks,
      createdById: userId,
      lines: {
        create: processedLines.map(line => ({
          productId: line.productId,
          warehouseId: line.warehouseId,
          quantity: line.quantity,
          reservedQuantity: 0,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent || 0,
          discountAmount: line.discountAmount,
          taxPercent: line.taxPercent || 0,
          taxAmount: line.taxAmount,
          lineTotal: line.lineTotal,
          remarks: line.remarks
        }))
      }
    },
    include: { lines: true }
  });

  await logAudit({
    module: "CRM",
    entityType: "SalesOrder",
    entityId: salesOrder.id,
    action: "CREATE",
    description: `Created Sales Order ${salesOrder.salesOrderNumber}`,
    afterValue: salesOrder,
  });

  return salesOrder;
}

/**
 * Updates an existing Sales Order.
 */
export async function updateSalesOrder(companyId: string, id: string, userId: string, data: any) {
  const existing = await prisma.salesOrder.findUnique({
    where: { id },
    include: { lines: true }
  });
  
  if (!existing || existing.companyId !== companyId) throw new Error("Sales Order not found");
  if (existing.status !== SalesOrderStatus.DRAFT && existing.status !== SalesOrderStatus.PENDING_APPROVAL) {
    throw new Error("Cannot modify a Sales Order that is already approved or open");
  }

  await validateSalesOrder(companyId, data);

  const { subtotal, taxAmount, shippingAmount, discountAmount, totalAmount, processedLines } = calculateTotals(
    data.lines, 
    Number(data.discountAmount || existing.discountAmount), 
    Number(data.shippingAmount || existing.shippingAmount)
  );

  const salesOrder = await prisma.$transaction(async (tx) => {
    await tx.salesOrderLine.deleteMany({ where: { salesOrderId: id } });

    return await tx.salesOrder.update({
      where: { id },
      data: {
        customerId: data.customerId,
        requestedDeliveryDate: data.requestedDeliveryDate,
        currency: data.currency,
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        totalAmount,
        remarks: data.remarks,
        lines: {
          create: processedLines.map(line => ({
            productId: line.productId,
            warehouseId: line.warehouseId,
            quantity: line.quantity,
            reservedQuantity: 0,
            unitPrice: line.unitPrice,
            discountPercent: line.discountPercent || 0,
            discountAmount: line.discountAmount,
            taxPercent: line.taxPercent || 0,
            taxAmount: line.taxAmount,
            lineTotal: line.lineTotal,
            remarks: line.remarks
          }))
        }
      },
      include: { lines: true }
    });
  });

  await logAudit({
    module: "CRM",
    entityType: "SalesOrder",
    entityId: salesOrder.id,
    action: "UPDATE",
    description: `Updated Sales Order ${salesOrder.salesOrderNumber}`,
    beforeValue: existing,
    afterValue: salesOrder,
  });

  return salesOrder;
}

/**
 * Deletes a draft Sales Order.
 */
export async function deleteSalesOrder(companyId: string, id: string) {
  const existing = await prisma.salesOrder.findFirst({
    where: { id, companyId }
  });

  if (!existing) throw new Error("Sales Order not found");
  if (existing.status !== SalesOrderStatus.DRAFT) throw new Error("Only DRAFT Sales Orders can be deleted");

  await prisma.salesOrder.delete({ where: { id } });

  await logAudit({
    module: "CRM",
    entityType: "SalesOrder",
    entityId: id,
    action: "DELETE",
    description: `Deleted Sales Order ${existing.salesOrderNumber}`,
    beforeValue: existing,
  });

  return true;
}

/**
 * Approves a Sales Order.
 */
export async function approveSalesOrder(companyId: string, id: string, userId: string) {
  const salesOrder = await prisma.salesOrder.update({
    where: { id, companyId },
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
  await prisma.$transaction(async (tx) => {
    for (const line of existing.lines) {
      await tx.salesOrderLine.update({
        where: { id: line.id },
        data: { reservedQuantity: line.quantity }
      });
      // NOTE: In an advanced system, we would also increment a `reservedQuantity` on the ProductWarehouse record here.
      // We are deliberately NOT generating physical Stock Movement records or Journal Entries per project rules.
    }

    await tx.salesOrder.update({
      where: { id },
      data: { status: SalesOrderStatus.OPEN }
    });
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

  await prisma.$transaction(async (tx) => {
    for (const line of existing.lines) {
      if (Number(line.reservedQuantity) > 0) {
        await tx.salesOrderLine.update({
          where: { id: line.id },
          data: { reservedQuantity: 0 }
        });
      }
    }
  });

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
 * Converts a Quotation directly into a Sales Order.
 */
export async function convertQuotation(companyId: string, quotationId: string, userId: string) {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, companyId },
    include: { lines: true }
  });

  if (!quotation) throw new Error("Quotation not found");

  const salesOrderData = {
    salesOrderNumber: await generateSalesOrderNumber(companyId),
    quotationId: quotation.id,
    customerId: quotation.customerId,
    currency: quotation.currency,
    discountAmount: quotation.discountAmount,
    shippingAmount: quotation.shippingAmount,
    remarks: quotation.remarks,
    lines: quotation.lines.map(line => ({
      productId: line.productId,
      warehouseId: line.warehouseId, // Crucial for reservation step later
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountPercent: line.discountPercent,
      taxPercent: line.taxPercent,
      remarks: line.remarks
    }))
  };

  return await createSalesOrder(companyId, userId, salesOrderData);
}

/**
 * Cancels a Sales Order and automatically releases any reservations.
 */
export async function cancelSalesOrder(companyId: string, id: string, userId: string) {
  await releaseReservation(companyId, id, userId);

  const salesOrder = await prisma.salesOrder.update({
    where: { id, companyId },
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
  const salesOrder = await prisma.salesOrder.update({
    where: { id, companyId },
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

/**
 * Retrieves audit history for a specific Sales Order.
 */
export async function getSalesOrderHistory(companyId: string, id: string) {
  return await prisma.globalAuditLog.findMany({
    where: {
      companyId,
      module: "CRM",
      entityType: "SalesOrder",
      entityId: id,
    },
    orderBy: { createdAt: 'desc' }
  });
}
