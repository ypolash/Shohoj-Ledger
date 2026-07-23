import prisma from "@/lib/prisma";
import crypto from "crypto";

/**
 * Version 1.3 Phase 2F: Enterprise Barcode & QR Code Infrastructure
 * Centralizes the assignment, generation, and resolution of all scannable entities.
 */

export const barcodeService = {

  // Supported Entity Types: PRODUCT, BATCH, SERIAL, WAREHOUSE, ZONE, BIN
  // Supported Barcode Types: CODE128, CODE39, EAN13, EAN8, UPC, QR

  validateBarcode: async (companyId: string, barcodeStr?: string, qrCodeStr?: string) => {
    if (barcodeStr) {
      const existing = await prisma.barcode.findFirst({ where: { barcode: barcodeStr } });
      if (existing) throw new Error("Barcode already exists globally.");
    }
    if (qrCodeStr) {
      const existing = await prisma.barcode.findFirst({ where: { qrCode: qrCodeStr } });
      if (existing) throw new Error("QR Code already exists globally.");
    }
  },

  validateEntity: async (companyId: string, entityType: string, entityId: string) => {
    switch (entityType) {
      case "PRODUCT":
        const product = await prisma.product.findFirst({ where: { id: entityId, companyId } });
        if (!product) throw new Error("Product not found.");
        break;
      case "BATCH":
        const batch = await prisma.inventoryBatch.findFirst({ where: { id: entityId, companyId } });
        if (!batch) throw new Error("Batch not found.");
        break;
      case "SERIAL":
        const serial = await prisma.inventorySerial.findFirst({ where: { id: entityId, companyId } });
        if (!serial) throw new Error("Serial not found.");
        break;
      case "WAREHOUSE":
        const warehouse = await prisma.warehouse.findFirst({ where: { id: entityId, companyId } });
        if (!warehouse) throw new Error("Warehouse not found.");
        break;
      case "ZONE":
        const zone = await prisma.warehouseZone.findFirst({ 
          where: { id: entityId, warehouse: { companyId } } 
        });
        if (!zone) throw new Error("Zone not found.");
        break;
      case "BIN":
        const bin = await prisma.warehouseBin.findFirst({ 
          where: { id: entityId, warehouse: { companyId } } 
        });
        if (!bin) throw new Error("Bin not found.");
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  },

  assignBarcode: async (data: {
    companyId: string;
    entityType: string;
    entityId: string;
    barcode?: string;
    barcodeType?: string;
    qrCode?: string;
    isPrimary?: boolean;
    userId: string;
  }) => {
    await barcodeService.validateEntity(data.companyId, data.entityType, data.entityId);
    await barcodeService.validateBarcode(data.companyId, data.barcode, data.qrCode);

    if (data.isPrimary) {
      // Demote existing primary barcodes for this entity
      await prisma.barcode.updateMany({
        where: { companyId: data.companyId, entityType: data.entityType, entityId: data.entityId },
        data: { isPrimary: false }
      });
    }

    return prisma.barcode.create({
      data: {
        companyId: data.companyId,
        entityType: data.entityType,
        entityId: data.entityId,
        barcode: data.barcode,
        barcodeType: data.barcodeType,
        qrCode: data.qrCode,
        isPrimary: data.isPrimary ?? true,
        generatedById: data.userId
      }
    });
  },

  generateBarcode: async (data: {
    companyId: string;
    entityType: string;
    entityId: string;
    barcodeType: string;
    userId: string;
  }) => {
    // Generate a unique 12-digit payload
    const payload = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const barcodeStr = `${payload}`;

    return barcodeService.assignBarcode({
      ...data,
      barcode: barcodeStr,
      isPrimary: true
    });
  },

  generateQRCode: async (data: {
    companyId: string;
    entityType: string;
    entityId: string;
    userId: string;
  }) => {
    const qrPayload = `SHO-${data.companyId.substring(0, 4)}-${data.entityType}-${data.entityId}`;
    const hash = crypto.createHash('sha256').update(qrPayload).digest('hex').substring(0, 16);
    const qrCodeStr = `QR-${hash}`;

    return barcodeService.assignBarcode({
      ...data,
      qrCode: qrCodeStr,
      isPrimary: true
    });
  },

  removeBarcode: async (id: string, companyId: string) => {
    return prisma.barcode.delete({
      where: { id, companyId }
    });
  },

  lookupBarcode: async (barcodeStr: string) => {
    const barcode = await prisma.barcode.findFirst({
      where: { barcode: barcodeStr }
    });
    if (!barcode) throw new Error("Barcode not found.");
    return barcode;
  },

  lookupQRCode: async (qrCodeStr: string) => {
    const barcode = await prisma.barcode.findFirst({
      where: { qrCode: qrCodeStr }
    });
    if (!barcode) throw new Error("QR Code not found.");
    return barcode;
  },

  printLabelData: async (companyId: string, entityType: string, entityId: string) => {
    const barcode = await prisma.barcode.findFirst({
      where: { companyId, entityType, entityId, isPrimary: true }
    });

    if (!barcode) throw new Error("No primary barcode/QR found for this entity.");

    let title = "";
    let subtitle = "";

    switch (entityType) {
      case "PRODUCT":
        const product = await prisma.product.findUnique({ where: { id: entityId } });
        title = product?.name || "Product";
        subtitle = `SKU: ${product?.sku || "N/A"}`;
        break;
      case "BATCH":
        const batch = await prisma.inventoryBatch.findUnique({ where: { id: entityId }, include: { product: true } });
        title = batch?.product.name || "Batch";
        subtitle = `Batch: ${batch?.batchNumber || "N/A"} (Exp: ${batch?.expiryDate?.toISOString().split('T')[0] || "None"})`;
        break;
      case "SERIAL":
        const serial = await prisma.inventorySerial.findUnique({ where: { id: entityId }, include: { product: true } });
        title = serial?.product.name || "Serial";
        subtitle = `SN: ${serial?.serialNumber || "N/A"}`;
        break;
      case "WAREHOUSE":
        const wh = await prisma.warehouse.findUnique({ where: { id: entityId } });
        title = wh?.name || "Warehouse";
        subtitle = `Code: ${wh?.code || "N/A"}`;
        break;
      case "BIN":
        const bin = await prisma.warehouseBin.findUnique({ where: { id: entityId } });
        title = bin?.name || "Bin";
        subtitle = `Code: ${bin?.code || "N/A"}`;
        break;
    }

    return {
      entityType: barcode.entityType,
      entityId: barcode.entityId,
      barcode: barcode.barcode,
      barcodeType: barcode.barcodeType,
      qrCode: barcode.qrCode,
      title,
      subtitle,
      companyId: barcode.companyId
    };
  },

  generateBatchLabels: async (companyId: string, batchId: string, userId: string) => {
    let barcode = await prisma.barcode.findFirst({
      where: { companyId, entityType: "BATCH", entityId: batchId, isPrimary: true }
    });

    if (!barcode) {
      barcode = await barcodeService.generateQRCode({ companyId, entityType: "BATCH", entityId: batchId, userId });
    }

    return barcodeService.printLabelData(companyId, "BATCH", batchId);
  },

  generateSerialLabels: async (companyId: string, serialId: string, userId: string) => {
    let barcode = await prisma.barcode.findFirst({
      where: { companyId, entityType: "SERIAL", entityId: serialId, isPrimary: true }
    });

    if (!barcode) {
      barcode = await barcodeService.generateBarcode({ 
        companyId, 
        entityType: "SERIAL", 
        entityId: serialId, 
        barcodeType: "CODE128", 
        userId 
      });
    }

    return barcodeService.printLabelData(companyId, "SERIAL", serialId);
  }
};
