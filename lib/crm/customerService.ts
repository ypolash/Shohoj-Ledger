import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { CustomerStatus } from "@prisma/client";

/**
 * Validates a customer for uniqueness constraints.
 */
export async function validateCustomer(
  companyId: string,
  data: { customerCode?: string; email?: string; phone?: string; id?: string }
) {
  const orConditions: any[] = [];
  
  if (data.customerCode) orConditions.push({ customerCode: data.customerCode });
  if (data.email) orConditions.push({ email: data.email });
  if (data.phone) orConditions.push({ phone: data.phone });

  if (orConditions.length === 0) return { valid: true };

  const existing = await prisma.customer.findFirst({
    where: {
      companyId,
      OR: orConditions,
      ...(data.id ? { id: { not: data.id } } : {}),
    },
    select: { customerCode: true, email: true, phone: true }
  });

  if (existing) {
    if (existing.customerCode === data.customerCode) throw new Error("Customer Code already exists");
    if (existing.email && existing.email === data.email) throw new Error("Email already exists");
    if (existing.phone && existing.phone === data.phone) throw new Error("Phone number already exists");
  }

  return { valid: true };
}

/**
 * Generates a unique customer code.
 */
export async function generateCustomerCode(companyId: string): Promise<string> {
  const count = await prisma.customer.count({
    where: { companyId }
  });
  
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const nextNumber = (count + 1).toString().padStart(4, "0");
  
  return `CUST-${dateStr}-${nextNumber}`;
}

/**
 * Creates a new customer.
 */
export async function createCustomer(companyId: string, userId: string, data: any) {
  if (!data.customerCode) {
    data.customerCode = await generateCustomerCode(companyId);
  }

  await validateCustomer(companyId, data);

  const customer = await prisma.customer.create({
    data: {
      ...data,
      companyId,
      createdById: userId,
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "Customer",
    entityId: customer.id,
    action: "CREATE",
    description: `Created customer ${customer.customerCode}`,
    afterValue: customer,
  });

  return customer;
}

/**
 * Updates an existing customer.
 */
export async function updateCustomer(companyId: string, id: string, data: any) {
  await validateCustomer(companyId, { ...data, id });

  const existing = await prisma.customer.findUnique({
    where: { id_companyId: { id, companyId } } // Actually unique is companyId, customerCode but id is primary key. Wait, id is CUID/UUID, just id is enough, but we should scope by companyId.
  });
  
  if (!existing) throw new Error("Customer not found");

  const customer = await prisma.customer.update({
    where: { id },
    data,
  });

  await logAudit({
    module: "CRM",
    entityType: "Customer",
    entityId: customer.id,
    action: "UPDATE",
    description: `Updated customer ${customer.customerCode}`,
    beforeValue: existing,
    afterValue: customer,
  });

  return customer;
}

/**
 * Deletes a customer.
 */
export async function deleteCustomer(companyId: string, id: string) {
  const existing = await prisma.customer.findFirst({
    where: { id, companyId }
  });

  if (!existing) throw new Error("Customer not found");

  await prisma.customer.delete({
    where: { id }
  });

  await logAudit({
    module: "CRM",
    entityType: "Customer",
    entityId: id,
    action: "DELETE",
    description: `Deleted customer ${existing.customerCode}`,
    beforeValue: existing,
  });

  return true;
}

/**
 * Retrieves a customer by ID with relations.
 */
export async function getCustomer(companyId: string, id: string) {
  return await prisma.customer.findFirst({
    where: { id, companyId },
    include: {
      customerGroup: true,
      addresses: true,
      contacts: true,
    }
  });
}

/**
 * Searches customers with pagination and filtering.
 */
export async function searchCustomers(
  companyId: string,
  params: { query?: string; status?: CustomerStatus; groupId?: string; skip?: number; take?: number }
) {
  const where: any = { companyId };
  
  if (params.query) {
    where.OR = [
      { name: { contains: params.query, mode: 'insensitive' } },
      { customerCode: { contains: params.query, mode: 'insensitive' } },
      { email: { contains: params.query, mode: 'insensitive' } },
      { phone: { contains: params.query, mode: 'insensitive' } },
    ];
  }

  if (params.status) where.status = params.status;
  if (params.groupId) where.customerGroupId = params.groupId;

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: params.skip || 0,
      take: params.take || 50,
      orderBy: { createdAt: 'desc' },
      include: { customerGroup: true }
    }),
    prisma.customer.count({ where })
  ]);

  return { data, total };
}

/**
 * Assigns a customer to a group.
 */
export async function assignCustomerGroup(companyId: string, id: string, groupId: string) {
  const group = await prisma.customerGroup.findFirst({
    where: { id: groupId, companyId }
  });

  if (!group) throw new Error("Customer group not found");

  return await updateCustomer(companyId, id, { customerGroupId: groupId });
}

/**
 * Updates a customer's credit limit.
 */
export async function updateCreditLimit(companyId: string, id: string, creditLimit: number, creditDays?: number) {
  const existing = await prisma.customer.findFirst({
    where: { id, companyId }
  });

  if (!existing) throw new Error("Customer not found");

  const data: any = { creditLimit };
  if (creditDays !== undefined) data.creditDays = creditDays;

  const customer = await prisma.customer.update({
    where: { id },
    data,
  });

  await logAudit({
    module: "CRM",
    entityType: "Customer",
    entityId: id,
    action: "UPDATE",
    description: `Updated credit limit for ${customer.customerCode}`,
    beforeValue: { creditLimit: existing.creditLimit, creditDays: existing.creditDays },
    afterValue: { creditLimit: customer.creditLimit, creditDays: customer.creditDays },
  });

  return customer;
}

/**
 * Retrieves audit history for a specific customer.
 */
export async function getCustomerHistory(companyId: string, id: string) {
  return await prisma.globalAuditLog.findMany({
    where: {
      companyId,
      module: "CRM",
      entityType: "Customer",
      entityId: id,
    },
    orderBy: { createdAt: 'desc' }
  });
}
