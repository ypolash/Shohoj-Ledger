import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { stockMovementService } from "./stockMovementService";

/**
 * Version 1.3 Phase 2J: Enterprise Stock Transfer Workflow
 * Manages the transfer of physical goods between Warehouses.
 */

export const stockTransferService = {

  generateTransferNumber: async (companyId: string) => {
    const count = await prisma.stockTransfer.count({ where: { companyId } });
    return `ST-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  },

  validateTransfer: async (companyId: string, transferId: string) => {
    const transfer = await prisma.stockTransfer.findFirst({
      where: { id: transferId, companyId },
      include: { lines: true }
    });
    if (!transfer) throw new Error("Stock Transfer not found.");
    return transfer;
  },

  createTransfer: async (data: {
    companyId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    requestedById: string;
    remarks?: string;
    lines: {
      productId: string;
      batchId?: string;
      serialId?: string;
      fromZoneId?: string;
      toZoneId?: string;
      fromBinId?: string;
      toBinId?: string;
      quantity: number | Decimal;
      remarks?: string;
    }[];
  }) => {
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw new Error("Source and Destination warehouses must be different.");
    }

    const transferNumber = await stockTransferService.generateTransferNumber(data.companyId);

    return prisma.stockTransfer.create({
      data: {
        companyId: data.companyId,
        transferNumber,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        requestedById: data.requestedById,
        status: "DRAFT",
        remarks: data.remarks,
        lines: {
          create: data.lines.map(line => ({
            productId: line.productId,
            batchId: line.batchId,
            serialId: line.serialId,
            fromZoneId: line.fromZoneId,
            toZoneId: line.toZoneId,
            fromBinId: line.fromBinId,
            toBinId: line.toBinId,
            quantity: new Decimal(line.quantity),
            remarks: line.remarks
          }))
        }
      },
      include: { lines: true }
    });
  },

  approveTransfer: async (id: string, companyId: string, approvedById: string) => {
    const transfer = await stockTransferService.validateTransfer(companyId, id);
    if (transfer.status !== "DRAFT" && transfer.status !== "PENDING_APPROVAL") {
      throw new Error("Transfer cannot be approved in its current state.");
    }

    return prisma.stockTransfer.update({
      where: { id },
      data: { status: "APPROVED", approvedById, transferDate: new Date() }
    });
  },

  shipTransfer: async (id: string, companyId: string, userId: string) => {
    const transfer = await stockTransferService.validateTransfer(companyId, id);
    if (transfer.status !== "APPROVED") throw new Error("Transfer must be APPROVED to be shipped.");

    return prisma.$transaction(async (tx) => {
      // Execute the physical transfer out from the Source Warehouse
      for (const line of transfer.lines) {
        await stockMovementService.recordMovement({
          companyId,
          productId: line.productId,
          warehouseId: transfer.fromWarehouseId,
          zoneId: line.fromZoneId || undefined,
          binId: line.fromBinId || undefined,
          movementType: "TRANSFER_OUT",
          referenceType: "STOCK_TRANSFER",
          referenceId: transfer.id,
          quantity: new Decimal(line.quantity).negated(),
          performedById: userId
        });
      }

      return tx.stockTransfer.update({
        where: { id },
        data: { status: "IN_TRANSIT" },
        include: { lines: true }
      });
    });
  },

  receiveTransfer: async (data: {
    companyId: string;
    transferId: string;
    userId: string;
    lines: {
      lineId: string;
      receivedQuantity: number | Decimal;
      toZoneId?: string;
      toBinId?: string;
    }[];
  }) => {
    const transfer = await stockTransferService.validateTransfer(data.companyId, data.transferId);
    if (transfer.status !== "IN_TRANSIT" && transfer.status !== "PARTIALLY_RECEIVED") {
      throw new Error("Transfer must be IN_TRANSIT or PARTIALLY_RECEIVED to receive goods.");
    }

    return prisma.$transaction(async (tx) => {
      for (const reqLine of data.lines) {
        const line = transfer.lines.find(l => l.id === reqLine.lineId);
        if (!line) throw new Error(`Line ${reqLine.lineId} not found.`);

        const rcvQty = new Decimal(reqLine.receivedQuantity);
        const currentRcv = new Decimal(line.receivedQuantity as any);
        const totalRequested = new Decimal(line.quantity as any);

        if (currentRcv.plus(rcvQty).greaterThan(totalRequested)) {
          throw new Error("Cannot receive more than what was shipped.");
        }

        // Execute the physical transfer into the Destination Warehouse
        await stockMovementService.recordMovement({
          companyId: data.companyId,
          productId: line.productId,
          warehouseId: transfer.toWarehouseId,
          zoneId: reqLine.toZoneId || line.toZoneId || undefined,
          binId: reqLine.toBinId || line.toBinId || undefined,
          movementType: "TRANSFER_IN",
          referenceType: "STOCK_TRANSFER",
          referenceId: transfer.id,
          quantity: rcvQty,
          performedById: data.userId
        });

        // Update Line Received Quantity
        await tx.stockTransferLine.update({
          where: { id: line.id },
          data: {
            receivedQuantity: { increment: rcvQty },
            toZoneId: reqLine.toZoneId || line.toZoneId,
            toBinId: reqLine.toBinId || line.toBinId,
          }
        });
      }

      return tx.stockTransfer.update({
        where: { id: transfer.id },
        data: { status: "PARTIALLY_RECEIVED" },
        include: { lines: true }
      });
    });
  },

  completeTransfer: async (id: string, companyId: string) => {
    const transfer = await stockTransferService.validateTransfer(companyId, id);
    if (transfer.status === "COMPLETED") throw new Error("Transfer is already completed.");

    // Validate that all lines are fully received
    for (const line of transfer.lines) {
      const received = new Decimal(line.receivedQuantity as any);
      const requested = new Decimal(line.quantity as any);
      if (!received.equals(requested)) {
        throw new Error(`Transfer cannot be completed. Line ${line.id} has a discrepancy between shipped and received quantity.`);
      }
    }

    // Future hook: accountingPostingService to handle transit valuation if needed.

    return prisma.stockTransfer.update({
      where: { id },
      data: { status: "COMPLETED" }
    });
  },

  cancelTransfer: async (id: string, companyId: string) => {
    const transfer = await stockTransferService.validateTransfer(companyId, id);
    if (transfer.status !== "DRAFT" && transfer.status !== "PENDING_APPROVAL") {
      throw new Error("Cannot cancel a transfer once it has been approved or shipped.");
    }

    return prisma.stockTransfer.update({
      where: { id },
      data: { status: "CANCELLED" }
    });
  },

  getTransferHistory: async (companyId: string) => {
    return prisma.stockTransfer.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        requestedBy: true,
        approvedBy: true,
        lines: true
      }
    });
  }
};
