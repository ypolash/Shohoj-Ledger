import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { GoodsReceiptStatus, PurchaseOrderStatus } from "@prisma/client";

/**
 * Enterprise Goods Receipt Note Service (Version 1.4 Phase 6)
 * 
 * GRN is the ONLY procurement document that updates inventory.
 */

export async function createGRN(companyId: string, userId: string, purchaseOrderId: string, data: any) {
  const grnNumber = data.grnNumber || await generateGRNNumber(companyId);

  // Validate PO
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId, companyId },
    include: { lines: true }
  });

  if (!po) throw new Error("Purchase Order not found.");
  if (po.status !== "OPEN" && po.status !== "PARTIALLY_RECEIVED") {
    throw new Error("Purchase Order must be OPEN or PARTIALLY_RECEIVED to receive goods.");
  }

  const grn = await prisma.goodsReceiptNote.create({
    data: {
      companyId,
      grnNumber,
      purchaseOrderId,
      supplierId: po.supplierId,
      warehouseId: data.warehouseId || po.warehouseId,
      status: GoodsReceiptStatus.DRAFT,
      receiptDate: data.receiptDate ? new Date(data.receiptDate) : new Date(),
      remarks: data.remarks,
      createdById: userId,
      lines: {
        create: data.lines.map((line: any) => ({
          purchaseOrderLineId: line.purchaseOrderLineId,
          productId: line.productId,
          batchId: line.batchId,
          serialId: line.serialId,
          quantityReceived: line.quantityReceived,
          quantityRejected: line.quantityRejected || 0,
          warehouseId: data.warehouseId || po.warehouseId,
          zoneId: line.zoneId,
          binId: line.binId,
          remarks: line.remarks
        }))
      }
    },
    include: { lines: true }
  });

  await logAudit({
    module: "PROCUREMENT",
    entityType: "GoodsReceiptNote",
    entityId: grn.id,
    action: "CREATE",
    description: `Created GRN ${grn.grnNumber} for PO ${po.purchaseOrderNumber}`
  });

  return grn;
}

export async function approveGRN(companyId: string, userId: string, id: string) {
  const grn = await validateReceipt(companyId, id, ["DRAFT", "PENDING_APPROVAL"]);

  const updated = await prisma.goodsReceiptNote.update({
    where: { id },
    data: { 
      status: GoodsReceiptStatus.APPROVED,
      approvedById: userId,
      approvedAt: new Date()
    }
  });

  await logAudit({
    module: "PROCUREMENT",
    entityType: "GoodsReceiptNote",
    entityId: id,
    action: "APPROVAL",
    description: `Approved GRN ${grn.grnNumber}`
  });

  return updated;
}

export async function receiveGoods(companyId: string, userId: string, id: string) {
  const grn = await prisma.goodsReceiptNote.findUnique({
    where: { id, companyId },
    include: { lines: true, purchaseOrder: { include: { lines: true } } }
  });

  if (!grn) throw new Error("GRN not found.");
  if (grn.status !== "APPROVED") {
    throw new Error("GRN must be APPROVED before receiving goods.");
  }

  // 1. Process Inventory Impacts via shared modules (Simulated calls to existing services)
  // In a complete implementation, this would heavily delegate to StockMovementService
  for (const line of grn.lines) {
    if (Number(line.quantityReceived) > 0) {
      // Create Stock Movement
      await prisma.stockMovement.create({
        data: {
          companyId,
          productId: line.productId,
          warehouseId: grn.warehouseId,
          quantity: line.quantityReceived,
          movementType: "IN",
          sourceType: "GOODS_RECEIPT",
          sourceId: grn.id,
          reference: grn.grnNumber,
          createdById: userId
        }
      });

      // Update ProductWarehouse balance
      const pw = await prisma.productWarehouse.findUnique({
        where: { companyId_productId_warehouseId: { companyId, productId: line.productId, warehouseId: grn.warehouseId } }
      });

      if (pw) {
        await prisma.productWarehouse.update({
          where: { id: pw.id },
          data: { quantity: { increment: line.quantityReceived } }
        });
      } else {
        await prisma.productWarehouse.create({
          data: {
            companyId,
            productId: line.productId,
            warehouseId: grn.warehouseId,
            quantity: line.quantityReceived
          }
        });
      }

      // Update Batch/Serial if specified
      if (line.batchId) {
        await assignBatch(line.batchId, line.quantityReceived);
      }
      if (line.serialId) {
        await assignSerial(line.serialId);
      }

      // Create FIFO Valuation Layer
      if (line.purchaseOrderLineId && grn.purchaseOrder) {
        const poLine = grn.purchaseOrder.lines.find(l => l.id === line.purchaseOrderLineId);
        if (poLine) {
          await createFIFO(companyId, line.productId, grn.warehouseId, line.quantityReceived, poLine.unitPrice);
        }
      }
    }
  }

  // 2. Update GRN Status
  const updatedGrn = await prisma.goodsReceiptNote.update({
    where: { id },
    data: { status: GoodsReceiptStatus.RECEIVED }
  });

  // 3. Update Purchase Order Status and Line Received Quantities
  if (grn.purchaseOrderId) {
    await updatePurchaseOrder(companyId, userId, grn.purchaseOrderId, grn.lines);
  }

  await logAudit({
    module: "PROCUREMENT",
    entityType: "GoodsReceiptNote",
    entityId: id,
    action: "UPDATE",
    description: `Received goods into warehouse for GRN ${grn.grnNumber}`
  });

  return updatedGrn;
}

export async function cancelGRN(companyId: string, userId: string, id: string, reason: string) {
  const grn = await validateReceipt(companyId, id, ["DRAFT", "PENDING_APPROVAL", "APPROVED"]);

  const updated = await prisma.goodsReceiptNote.update({
    where: { id },
    data: { 
      status: GoodsReceiptStatus.CANCELLED,
      remarks: grn.remarks ? `${grn.remarks}\nCancel Reason: ${reason}` : `Cancel Reason: ${reason}`
    }
  });

  await logAudit({
    module: "PROCUREMENT",
    entityType: "GoodsReceiptNote",
    entityId: id,
    action: "UPDATE",
    description: `Cancelled GRN ${grn.grnNumber}. Reason: ${reason}`
  });

  return updated;
}

export async function generateGRNNumber(companyId: string): Promise<string> {
  const count = await prisma.goodsReceiptNote.count({ where: { companyId } });
  return `GRN-${(count + 1).toString().padStart(5, '0')}`;
}

export async function validateReceipt(companyId: string, id: string, allowedStatuses: GoodsReceiptStatus[]) {
  const grn = await prisma.goodsReceiptNote.findUnique({ where: { id, companyId } });
  if (!grn) throw new Error("GRN not found.");
  if (!allowedStatuses.includes(grn.status)) {
    throw new Error(`Invalid status transition. Current status: ${grn.status}. Required: ${allowedStatuses.join(", ")}`);
  }
  return grn;
}

export async function createFIFO(companyId: string, productId: string, warehouseId: string, quantity: any, unitCost: any) {
  await prisma.inventoryValuationLayer.create({
    data: {
      companyId,
      productId,
      warehouseId,
      quantity,
      remainingQty: quantity,
      unitCost,
      status: "OPEN"
    }
  });
}

export async function assignBatch(batchId: string, quantity: any) {
  await prisma.inventoryBatch.update({
    where: { id: batchId },
    data: { quantity: { increment: quantity } }
  });
}

export async function assignSerial(serialId: string) {
  await prisma.inventorySerial.update({
    where: { id: serialId },
    data: { status: "ACTIVE" }
  });
}

export async function updatePurchaseOrder(companyId: string, userId: string, poId: string, grnLines: any[]) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId, companyId },
    include: { lines: true }
  });

  if (!po) return;

  let allReceived = true;
  let anyReceived = false;

  for (const poLine of po.lines) {
    const receivedInThisGrn = grnLines.filter(l => l.purchaseOrderLineId === poLine.id)
                                      .reduce((sum, l) => sum + Number(l.quantityReceived), 0);
    
    if (receivedInThisGrn > 0) {
      await prisma.purchaseOrderLine.update({
        where: { id: poLine.id },
        data: { receivedQuantity: { increment: receivedInThisGrn } }
      });
    }

    const newTotalReceived = Number(poLine.receivedQuantity) + receivedInThisGrn;
    
    if (newTotalReceived < Number(poLine.quantity)) {
      allReceived = false;
    }
    if (newTotalReceived > 0) {
      anyReceived = true;
    }
  }

  let newStatus = po.status;
  if (allReceived) {
    newStatus = "RECEIVED";
  } else if (anyReceived) {
    newStatus = "PARTIALLY_RECEIVED";
  }

  if (newStatus !== po.status) {
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: newStatus as PurchaseOrderStatus }
    });
  }
}

export async function getGRNHistory(companyId: string, id: string) {
  return prisma.globalAuditLog.findMany({
    where: { companyId, entityType: "GoodsReceiptNote", entityId: id },
    orderBy: { createdAt: 'desc' }
  });
}
