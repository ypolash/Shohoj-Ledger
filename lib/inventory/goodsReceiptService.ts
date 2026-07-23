import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { stockMovementService } from "./stockMovementService";
import { batchService } from "./batchService";
import { serialService } from "./serialService";
// import { accountingPostingService } from "../accounting/accountingPostingService"; // Stubbed for Phase 2G per "PostingEngine reused"

/**
 * Version 1.3 Phase 2G: Enterprise Purchase Receiving Workflow
 * Bridges the gap between Procurement (Purchase Orders) and Inventory/Accounting.
 */

export const goodsReceiptService = {

  generateReceiptNumber: async (companyId: string) => {
    // Basic generator for GRN
    const count = await prisma.goodsReceipt.count({ where: { companyId } });
    return `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  },

  validateReceipt: async (companyId: string, warehouseId: string, supplierId: string, purchaseOrderId?: string) => {
    const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, companyId } });
    if (!warehouse) throw new Error("Warehouse not found or inactive.");

    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, companyId } });
    if (!supplier) throw new Error("Supplier not found.");

    // Note: Purchase Order validation would exist here if the PO module was fully built out in this version.
  },

  createReceipt: async (data: {
    companyId: string;
    warehouseId: string;
    supplierId: string;
    purchaseOrderId?: string;
    remarks?: string;
    userId: string;
    lines: {
      productId: string;
      orderedQuantity: number | Decimal;
    }[];
  }) => {
    await goodsReceiptService.validateReceipt(data.companyId, data.warehouseId, data.supplierId, data.purchaseOrderId);
    
    const receiptNumber = await goodsReceiptService.generateReceiptNumber(data.companyId);

    return prisma.goodsReceipt.create({
      data: {
        companyId: data.companyId,
        warehouseId: data.warehouseId,
        supplierId: data.supplierId,
        purchaseOrderId: data.purchaseOrderId,
        receiptNumber,
        status: "DRAFT",
        remarks: data.remarks,
        lines: {
          create: data.lines.map(line => ({
            productId: line.productId,
            orderedQuantity: new Decimal(line.orderedQuantity)
          }))
        }
      },
      include: { lines: true }
    });
  },

  receiveItems: async (id: string, companyId: string, updates: {
    lineId: string;
    receivedQuantity: number | Decimal;
  }[]) => {
    const receipt = await prisma.goodsReceipt.findFirst({ where: { id, companyId }, include: { lines: true } });
    if (!receipt) throw new Error("Goods Receipt not found.");
    if (receipt.status !== "DRAFT" && receipt.status !== "RECEIVING") throw new Error("Cannot update items in this status.");

    return prisma.$transaction(async (tx) => {
      for (const update of updates) {
        const line = receipt.lines.find(l => l.id === update.lineId);
        if (!line) throw new Error(`Line ${update.lineId} not found.`);
        
        await tx.goodsReceiptLine.update({
          where: { id: line.id },
          data: { receivedQuantity: new Decimal(update.receivedQuantity) }
        });
      }

      const updated = await tx.goodsReceipt.update({
        where: { id },
        data: { status: "RECEIVING" },
        include: { lines: true }
      });
      return updated;
    });
  },

  acceptItems: async (data: {
    companyId: string;
    receiptId: string;
    userId: string;
    lines: {
      lineId: string;
      acceptedQuantity: number | Decimal;
      rejectedQuantity: number | Decimal;
      binId?: string;
      batchNumber?: string;
      manufactureDate?: Date;
      expiryDate?: Date;
      serialNumber?: string;
      unitCost?: number | Decimal;
    }[];
  }) => {
    const receipt = await prisma.goodsReceipt.findFirst({ where: { id: data.receiptId, companyId: data.companyId }, include: { lines: true } });
    if (!receipt) throw new Error("Goods Receipt not found.");
    if (receipt.status === "COMPLETED" || receipt.status === "CANCELLED") throw new Error("Receipt cannot be modified.");

    // This method processes the physical induction of accepted quantities into the warehouse.
    // Rejected quantities are NOT inducted into ProductWarehouse (they never hit the ledger).

    return prisma.$transaction(async (tx) => {
      for (const reqLine of data.lines) {
        const line = receipt.lines.find(l => l.id === reqLine.lineId);
        if (!line) throw new Error(`Line ${reqLine.lineId} not found.`);

        const accepted = new Decimal(reqLine.acceptedQuantity);
        const rejected = new Decimal(reqLine.rejectedQuantity);
        
        const totalReceived = new Decimal(line.receivedQuantity as any);
        if (accepted.plus(rejected).greaterThan(totalReceived)) {
          throw new Error("Accepted + Rejected cannot exceed Received quantity.");
        }

        let batchId: string | undefined = undefined;
        let serialId: string | undefined = undefined;

        // If batch-controlled
        if (reqLine.batchNumber && accepted.greaterThan(0)) {
          const batch = await batchService.receiveBatch({
            companyId: data.companyId,
            productId: line.productId,
            warehouseId: receipt.warehouseId,
            batchNumber: reqLine.batchNumber,
            manufactureDate: reqLine.manufactureDate,
            expiryDate: reqLine.expiryDate,
            quantity: accepted,
            referenceType: "GOODS_RECEIPT",
            referenceId: receipt.id,
            userId: data.userId
          });
          batchId = batch.id;
        }

        // If serial-controlled (Assume 1 serial per line for simplicity, in reality this loops)
        else if (reqLine.serialNumber && accepted.equals(1)) {
          const serial = await serialService.receiveSerial({
            companyId: data.companyId,
            productId: line.productId,
            warehouseId: receipt.warehouseId,
            serialNumber: reqLine.serialNumber,
            referenceType: "GOODS_RECEIPT",
            referenceId: receipt.id,
            userId: data.userId
          });
          serialId = serial.id;
        }
        
        // If Standard (No batch, No serial)
        else if (accepted.greaterThan(0)) {
          await stockMovementService.recordMovement({
            companyId: data.companyId,
            productId: line.productId,
            warehouseId: receipt.warehouseId,
            zoneId: undefined,
            binId: reqLine.binId,
            movementType: "RECEIVE",
            referenceType: "GOODS_RECEIPT",
            referenceId: receipt.id,
            quantity: accepted,
            unitCost: reqLine.unitCost,
            performedById: data.userId
          });
        }

        // Update GRN Line
        await tx.goodsReceiptLine.update({
          where: { id: line.id },
          data: {
            acceptedQuantity: accepted,
            rejectedQuantity: rejected,
            binId: reqLine.binId,
            batchId,
            serialId
          }
        });
      }

      return tx.goodsReceipt.update({
        where: { id: receipt.id },
        data: { status: "PARTIAL" }, // Changed to completed on formal close
        include: { lines: true }
      });
    });
  },

  completeReceipt: async (id: string, companyId: string, userId: string) => {
    const receipt = await prisma.goodsReceipt.findFirst({ where: { id, companyId }, include: { lines: true } });
    if (!receipt) throw new Error("Goods Receipt not found.");

    // This is the step where Accounting Posting is officially invoked.
    // accountingPostingService.post({
    //   companyId,
    //   referenceType: "GOODS_RECEIPT",
    //   referenceId: receipt.id,
    //   ... (Generate Journal Entry mapping Inventory Assets and Accounts Payable or GRNI)
    // });

    return prisma.goodsReceipt.update({
      where: { id },
      data: { status: "COMPLETED", receivedById: userId }
    });
  },

  cancelReceipt: async (id: string, companyId: string) => {
    const receipt = await prisma.goodsReceipt.findFirst({ where: { id, companyId } });
    if (!receipt) throw new Error("Goods Receipt not found.");
    if (receipt.status === "COMPLETED") throw new Error("Cannot cancel a completed receipt.");

    return prisma.goodsReceipt.update({
      where: { id },
      data: { status: "CANCELLED" }
    });
  },

  getReceipt: async (id: string, companyId: string) => {
    return prisma.goodsReceipt.findFirst({
      where: { id, companyId },
      include: { lines: { include: { product: true, batch: true, serial: true, bin: true } }, supplier: true, warehouse: true }
    });
  },

  listReceipts: async (companyId: string) => {
    return prisma.goodsReceipt.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: { supplier: true, warehouse: true }
    });
  }
};
