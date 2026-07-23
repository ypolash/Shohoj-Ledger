import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";

/**
 * Enterprise Supplier Master Service (Version 1.4)
 */

export async function createSupplier(companyId: string, userId: string, data: any) {
  // 1. Generate Code if not provided
  const supplierCode = data.supplierCode || await generateSupplierCode(companyId);

  // 2. Insert Supplier with related data
  const supplier = await prisma.supplier.create({
    data: {
      companyId,
      supplierCode,
      name: data.name,
      taxNumber: data.taxNumber,
      vatNumber: data.vatNumber,
      tradeLicense: data.tradeLicense,
      paymentTerms: data.paymentTerms,
      creditLimit: data.creditLimit || 0,
      currency: data.currency || "USD",
      categoryId: data.categoryId,
      createdById: userId,
      status: "ACTIVE",
      addresses: data.addresses ? { create: data.addresses } : undefined,
      contacts: data.contacts ? { create: data.contacts } : undefined,
      bankAccounts: data.bankAccounts ? { create: data.bankAccounts } : undefined,
    }
  });

  // 3. Log Audit
  await logAudit({
    companyId,
    userId,
    action: "CREATE",
    entity: "Supplier",
    entityId: supplier.id,
    details: `Created new supplier ${supplier.name} (${supplier.supplierCode})`
  });

  return supplier;
}

export async function updateSupplier(companyId: string, userId: string, supplierId: string, data: any) {
  const existing = await prisma.supplier.findUnique({ where: { id: supplierId, companyId } });
  if (!existing) throw new Error("Supplier not found");

  const supplier = await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      name: data.name,
      taxNumber: data.taxNumber,
      vatNumber: data.vatNumber,
      tradeLicense: data.tradeLicense,
      paymentTerms: data.paymentTerms,
      creditLimit: data.creditLimit,
      currency: data.currency,
      categoryId: data.categoryId,
    }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entity: "Supplier",
    entityId: supplier.id,
    details: `Updated profile for supplier ${supplier.name}`
  });

  return supplier;
}

export async function deleteSupplier(companyId: string, userId: string, supplierId: string) {
  const existing = await prisma.supplier.findUnique({ where: { id: supplierId, companyId } });
  if (!existing) throw new Error("Supplier not found");

  // Soft delete via status change or hard delete depending on strict rules
  await prisma.supplier.delete({ where: { id: supplierId } });

  await logAudit({
    companyId,
    userId,
    action: "DELETE",
    entity: "Supplier",
    entityId: supplierId,
    details: `Deleted supplier ${existing.name}`
  });

  return { success: true };
}

export async function getSupplier(companyId: string, supplierId: string) {
  return prisma.supplier.findUnique({
    where: { id: supplierId, companyId },
    include: {
      category: true,
      addresses: true,
      contacts: true,
      bankAccounts: true,
      documents: true
    }
  });
}

export async function searchSuppliers(companyId: string, query: string = "", status?: any) {
  return prisma.supplier.findMany({
    where: {
      companyId,
      ...(status && { status }),
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { supplierCode: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } }
      ]
    },
    include: { category: true }
  });
}

export async function generateSupplierCode(companyId: string): Promise<string> {
  const count = await prisma.supplier.count({ where: { companyId } });
  return `VEND-${(count + 1).toString().padStart(5, '0')}`;
}

export async function validateSupplier(companyId: string, supplierId: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId, companyId } });
  if (!supplier) throw new Error("Supplier not found.");
  if (supplier.status === "BLOCKED" || supplier.status === "BLACKLISTED") {
    throw new Error(`Cannot process transactions. Supplier is ${supplier.status}.`);
  }
  return supplier;
}

export async function assignCategory(companyId: string, userId: string, supplierId: string, categoryId: string) {
  const supplier = await prisma.supplier.update({
    where: { id: supplierId, companyId },
    data: { categoryId }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entity: "Supplier",
    entityId: supplier.id,
    details: `Assigned category ${categoryId} to supplier ${supplier.name}`
  });

  return supplier;
}

export async function updateCreditTerms(companyId: string, userId: string, supplierId: string, creditLimit: number, paymentTerms: string) {
  const supplier = await prisma.supplier.update({
    where: { id: supplierId, companyId },
    data: { creditLimit, paymentTerms }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entity: "Supplier",
    entityId: supplier.id,
    details: `Updated credit terms to Limit: ${creditLimit}, Terms: ${paymentTerms}`
  });

  return supplier;
}

export async function blockSupplier(companyId: string, userId: string, supplierId: string, reason: string) {
  const supplier = await prisma.supplier.update({
    where: { id: supplierId, companyId },
    data: { status: "BLOCKED" }
  });

  await prisma.supplierCommunicationLog.create({
    data: {
      supplierId,
      type: "SYSTEM",
      notes: `Blocked by User ${userId}. Reason: ${reason}`
    }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entity: "Supplier",
    entityId: supplier.id,
    details: `Blocked supplier ${supplier.name}. Reason: ${reason}`
  });

  return supplier;
}

export async function unblockSupplier(companyId: string, userId: string, supplierId: string, reason: string) {
  const supplier = await prisma.supplier.update({
    where: { id: supplierId, companyId },
    data: { status: "ACTIVE" }
  });

  await prisma.supplierCommunicationLog.create({
    data: {
      supplierId,
      type: "SYSTEM",
      notes: `Unblocked by User ${userId}. Reason: ${reason}`
    }
  });

  await logAudit({
    companyId,
    userId,
    action: "UPDATE",
    entity: "Supplier",
    entityId: supplier.id,
    details: `Unblocked supplier ${supplier.name}. Reason: ${reason}`
  });

  return supplier;
}

export async function getSupplierHistory(companyId: string, supplierId: string) {
  return prisma.supplierCommunicationLog.findMany({
    where: { supplierId, supplier: { companyId } },
    orderBy: { createdAt: 'desc' }
  });
}
