import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import bcrypt from "bcrypt";
import { calculateCustomerBalance } from "@/lib/crm/customerPaymentService";
import { calculateAvailableCredit, calculateExposure } from "@/lib/crm/customerCreditService";

/**
 * Validates active portal access for a customer.
 */
export async function validatePortalAccess(companyId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId }
  });

  if (!customer) throw new Error("Customer not found.");
  if (!customer.isPortalActive) throw new Error("Portal access is disabled for this customer.");
  
  return customer;
}

/**
 * Authenticates a customer for portal access.
 */
export async function authenticateCustomer(companyId: string, email: string, passwordPlain: string) {
  const customer = await prisma.customer.findFirst({
    where: { companyId, email }
  });

  if (!customer || !customer.isPortalActive || !customer.portalPassword) {
    throw new Error("Invalid credentials or portal access denied.");
  }

  const isValid = await bcrypt.compare(passwordPlain, customer.portalPassword);
  if (!isValid) {
    throw new Error("Invalid credentials.");
  }

  await logAudit({
    module: "PORTAL",
    entityType: "Customer",
    entityId: customer.id,
    action: "LOGIN",
    description: `Customer authenticated into portal.`
  });

  // Mocking session token generation for the service layer
  return {
    token: `PORTAL_SESSION_${customer.id}_${Date.now()}`,
    customer: { id: customer.id, name: customer.name, email: customer.email }
  };
}

/**
 * Updates customer's portal password.
 */
export async function changePassword(companyId: string, customerId: string, oldPasswordPlain: string, newPasswordPlain: string) {
  const customer = await validatePortalAccess(companyId, customerId);

  if (!customer.portalPassword) throw new Error("Password not set.");

  const isValid = await bcrypt.compare(oldPasswordPlain, customer.portalPassword);
  if (!isValid) throw new Error("Invalid current password.");

  const hashed = await bcrypt.hash(newPasswordPlain, 10);
  
  await prisma.customer.update({
    where: { id: customer.id },
    data: { portalPassword: hashed }
  });

  await logAudit({
    module: "PORTAL",
    entityType: "Customer",
    entityId: customer.id,
    action: "UPDATE",
    description: `Customer changed portal password.`
  });

  return { success: true };
}

/**
 * Retrieves the customer's own profile.
 */
export async function getCustomerProfile(companyId: string, customerId: string) {
  await validatePortalAccess(companyId, customerId);
  return await prisma.customer.findFirst({
    where: { id: customerId, companyId },
    include: {
      addresses: true,
      contacts: true
    }
  });
}

/**
 * Allows the customer to update basic profile info.
 */
export async function updateCustomerProfile(companyId: string, customerId: string, data: any) {
  await validatePortalAccess(companyId, customerId);
  
  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: {
      phone: data.phone,
      mobile: data.mobile,
      website: data.website
    }
  });

  await logAudit({
    module: "PORTAL",
    entityType: "Customer",
    entityId: customerId,
    action: "UPDATE",
    description: `Customer updated their profile from the portal.`
  });

  return updated;
}

/**
 * Fetches the customer's quotations.
 */
export async function getQuotations(companyId: string, customerId: string) {
  await validatePortalAccess(companyId, customerId);
  return await prisma.quotation.findMany({
    where: { companyId, customerId },
    orderBy: { createdAt: "desc" },
    include: { lines: true }
  });
}

/**
 * Fetches the customer's sales orders.
 */
export async function getSalesOrders(companyId: string, customerId: string) {
  await validatePortalAccess(companyId, customerId);
  return await prisma.salesOrder.findMany({
    where: { companyId, customerId },
    orderBy: { orderDate: "desc" },
    include: { lines: true }
  });
}

/**
 * Fetches the customer's delivery orders.
 */
export async function getDeliveries(companyId: string, customerId: string) {
  await validatePortalAccess(companyId, customerId);
  // Delivery orders are fetched via the SalesOrders for this customer to ensure strict isolation
  return await prisma.deliveryOrder.findMany({
    where: { companyId, lines: { some: { salesOrderLine: { salesOrder: { customerId } } } } },
    orderBy: { createdAt: "desc" },
    include: { lines: true }
  });
}

/**
 * Fetches the customer's returns (RMAs).
 */
export async function getReturns(companyId: string, customerId: string) {
  await validatePortalAccess(companyId, customerId);
  return await prisma.customerReturn.findMany({
    where: { companyId, customerId },
    orderBy: { returnDate: "desc" },
    include: { lines: true }
  });
}

/**
 * Fetches the customer's payment history.
 */
export async function getPayments(companyId: string, customerId: string) {
  await validatePortalAccess(companyId, customerId);
  return await prisma.customerPayment.findMany({
    where: { companyId, customerId },
    orderBy: { paymentDate: "desc" },
    include: { allocations: true }
  });
}

/**
 * Gets real-time outstanding balance and credit limits.
 */
export async function getOutstandingBalance(companyId: string, customerId: string) {
  await validatePortalAccess(companyId, customerId);
  
  const unallocatedAdvance = await calculateCustomerBalance(companyId, customerId);
  const creditExposure = await calculateExposure(companyId, customerId);
  const availableCredit = await calculateAvailableCredit(companyId, customerId);

  return {
    advanceBalance: unallocatedAdvance,
    currentExposure: creditExposure,
    availableCredit
  };
}

/**
 * Aggregates a statement of account.
 */
export async function getAccountStatement(companyId: string, customerId: string, startDate: Date, endDate: Date) {
  await validatePortalAccess(companyId, customerId);
  
  // Future Phase 3I/3J full accounting integration will query LedgerEntries here.
  // For now, we mock the retrieval of orders and payments.
  
  const orders = await prisma.salesOrder.findMany({
    where: { companyId, customerId, orderDate: { gte: startDate, lte: endDate } }
  });
  
  const payments = await prisma.customerPayment.findMany({
    where: { companyId, customerId, paymentDate: { gte: startDate, lte: endDate } }
  });

  await logAudit({
    module: "PORTAL",
    entityType: "Customer",
    entityId: customerId,
    action: "REPORT",
    description: `Customer generated account statement for period ${startDate.toISOString()} to ${endDate.toISOString()}`
  });

  return {
    period: { startDate, endDate },
    orders,
    payments,
    summary: "Statement details will fully populate via PostingEngine in future releases."
  };
}

/**
 * Handles secure document downloading (mock logic).
 */
export async function downloadDocuments(companyId: string, customerId: string, documentType: string, documentId: string) {
  await validatePortalAccess(companyId, customerId);

  await logAudit({
    module: "PORTAL",
    entityType: "Customer",
    entityId: customerId,
    action: "DOWNLOAD",
    description: `Customer downloaded document: ${documentType} - ${documentId}`
  });

  return {
    url: `https://storage.shohoj.com/${companyId}/portal/${customerId}/${documentType}/${documentId}.pdf`
  };
}

/**
 * Aggregates summary data for the portal dashboard.
 */
export async function getPortalDashboard(companyId: string, customerId: string) {
  await validatePortalAccess(companyId, customerId);

  const activeOrders = await prisma.salesOrder.count({
    where: { companyId, customerId, status: { notIn: ["DELIVERED", "CANCELLED"] } }
  });

  const recentDeliveries = await prisma.deliveryOrder.findMany({
    where: { companyId, lines: { some: { salesOrderLine: { salesOrder: { customerId } } } } },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const balance = await getOutstandingBalance(companyId, customerId);

  return {
    activeOrders,
    recentDeliveries,
    balance
  };
}
