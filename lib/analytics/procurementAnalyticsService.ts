import { prisma } from "@/lib/prisma";

/**
 * Enterprise Procurement Analytics Engine (Version 1.4 Phase 9)
 * 
 * Provides read-only analytical aggregations across the entire Procurement lifecycle.
 */

export async function getExecutiveDashboard(companyId: string, startDate?: Date, endDate?: Date) {
  const [
    supplierStats,
    prStats,
    rfqStats,
    poStats,
    grnStats,
    invoiceStats,
    paymentStats,
    outstandingBalance,
    topSuppliers,
    spendAnalysis,
    procurementCycle,
    leadTime,
    variance
  ] = await Promise.all([
    getSupplierDashboard(companyId),
    getPurchaseRequisitionDashboard(companyId, startDate, endDate),
    getRFQDashboard(companyId, startDate, endDate),
    getPurchaseDashboard(companyId, startDate, endDate),
    getGRNDashboard(companyId, startDate, endDate),
    getInvoiceDashboard(companyId, startDate, endDate),
    getPaymentDashboard(companyId, startDate, endDate),
    getOutstandingSupplierBalance(companyId),
    getTopSuppliers(companyId, 5, startDate, endDate),
    getSpendAnalysis(companyId, startDate, endDate),
    getProcurementCycle(companyId, startDate, endDate),
    getLeadTimeAnalysis(companyId, startDate, endDate),
    getPurchaseVariance(companyId, startDate, endDate)
  ]);

  return {
    supplierStats,
    prStats,
    rfqStats,
    poStats,
    grnStats,
    invoiceStats,
    paymentStats,
    outstandingBalance,
    topSuppliers,
    spendAnalysis,
    procurementCycle,
    leadTime,
    variance
  };
}

export async function getSupplierDashboard(companyId: string) {
  const total = await prisma.supplier.count({ where: { companyId } });
  // Currently, we don't have explicit 'active' or 'blocked' flags in the Supplier model schema,
  // so we mock these or just return the total. 
  // Assuming all are active for now unless status is added later.
  return {
    totalSuppliers: total,
    activeSuppliers: total,
    blockedSuppliers: 0
  };
}

export async function getPurchaseRequisitionDashboard(companyId: string, startDate?: Date, endDate?: Date) {
  const where = buildDateWhere(companyId, startDate, endDate);
  const count = await prisma.purchaseRequisition.count({ where });
  return {
    totalRequisitions: count
  };
}

export async function getRFQDashboard(companyId: string, startDate?: Date, endDate?: Date) {
  const where = buildDateWhere(companyId, startDate, endDate);
  const openCount = await prisma.requestForQuotation.count({
    where: { ...where, status: { in: ["DRAFT", "PUBLISHED"] } }
  });
  const totalCount = await prisma.requestForQuotation.count({ where });
  return {
    totalRFQs: totalCount,
    openRFQs: openCount
  };
}

export async function getPurchaseDashboard(companyId: string, startDate?: Date, endDate?: Date) {
  const where = buildDateWhere(companyId, startDate, endDate);
  const totalOrders = await prisma.purchaseOrder.count({ where });
  const openOrders = await getOpenPurchaseOrders(companyId, startDate, endDate);
  return {
    totalOrders,
    openOrders
  };
}

export async function getGRNDashboard(companyId: string, startDate?: Date, endDate?: Date) {
  const where = buildDateWhere(companyId, startDate, endDate);
  const total = await prisma.goodsReceiptNote.count({ where });
  return {
    totalGRNs: total
  };
}

export async function getInvoiceDashboard(companyId: string, startDate?: Date, endDate?: Date) {
  const where = buildDateWhere(companyId, startDate, endDate);
  const total = await prisma.supplierInvoice.count({ where });
  return {
    totalInvoices: total
  };
}

export async function getPaymentDashboard(companyId: string, startDate?: Date, endDate?: Date) {
  const where = buildDateWhere(companyId, startDate, endDate);
  const total = await prisma.supplierPayment.count({ where });
  return {
    totalPayments: total
  };
}

export async function getOpenPurchaseOrders(companyId: string, startDate?: Date, endDate?: Date) {
  const where = buildDateWhere(companyId, startDate, endDate);
  return prisma.purchaseOrder.count({
    where: { ...where, status: { in: ["OPEN", "PARTIALLY_RECEIVED"] } }
  });
}

export async function getOutstandingSupplierBalance(companyId: string) {
  const invoices = await prisma.supplierInvoice.aggregate({
    where: { companyId, status: "POSTED" },
    _sum: { totalAmount: true }
  });

  const payments = await prisma.supplierPayment.aggregate({
    where: { companyId, status: { in: ["POSTED", "PARTIALLY_ALLOCATED", "FULLY_ALLOCATED"] } },
    _sum: { amount: true }
  });

  const totalInvoice = Number(invoices._sum.totalAmount || 0);
  const totalPayment = Number(payments._sum.amount || 0);

  return totalInvoice - totalPayment;
}

export async function getTopSuppliers(companyId: string, limit: number = 5, startDate?: Date, endDate?: Date) {
  const where = buildDateWhere(companyId, startDate, endDate);
  
  const invoices = await prisma.supplierInvoice.groupBy({
    by: ['supplierId'],
    where: { ...where, status: "POSTED" },
    _sum: { totalAmount: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: limit
  });

  const supplierIds = invoices.map(i => i.supplierId);
  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: supplierIds } },
    select: { id: true, name: true, supplierCode: true }
  });

  return invoices.map(inv => ({
    supplier: suppliers.find(s => s.id === inv.supplierId),
    totalSpend: Number(inv._sum.totalAmount || 0)
  }));
}

export async function getSupplierPerformance(companyId: string, supplierId: string, startDate?: Date, endDate?: Date) {
  // Aggregate KPIs like on-time delivery, defect rate, etc.
  // Currently mocked based on available schema.
  return {
    supplierId,
    onTimeDeliveryRate: "95%",
    qualityAcceptanceRate: "98%"
  };
}

export async function getPurchaseTrend(companyId: string, startDate?: Date, endDate?: Date) {
  // Can group POs by month using native queries or processing in memory for small datasets.
  return [];
}

export async function getSpendAnalysis(companyId: string, startDate?: Date, endDate?: Date) {
  const where = buildDateWhere(companyId, startDate, endDate);
  const totalSpend = await prisma.supplierInvoice.aggregate({
    where: { ...where, status: "POSTED" },
    _sum: { totalAmount: true }
  });
  return {
    totalSpend: Number(totalSpend._sum.totalAmount || 0)
  };
}

export async function getProcurementCycle(companyId: string, startDate?: Date, endDate?: Date) {
  // Mock: Average days from PR -> PO -> GRN -> Payment
  return {
    averageCycleDays: 14.5
  };
}

export async function getLeadTimeAnalysis(companyId: string, startDate?: Date, endDate?: Date) {
  // Mock: Average days from PO -> GRN
  return {
    averageLeadTimeDays: 5.2
  };
}

export async function getPurchaseVariance(companyId: string, startDate?: Date, endDate?: Date) {
  const where = buildDateWhere(companyId, startDate, endDate);
  const variances = await prisma.threeWayMatch.aggregate({
    where: { ...where, matchStatus: { not: "MATCHED" } },
    _sum: { varianceAmount: true }
  });
  return {
    totalVarianceAmount: Number(variances._sum.varianceAmount || 0)
  };
}

export async function getApprovalStatistics(companyId: string, startDate?: Date, endDate?: Date) {
  // Mock: Average approval times
  return {
    averagePOApprovalTimeHours: 24,
    averageInvoiceApprovalTimeHours: 48
  };
}

// Utility function to build date filters
function buildDateWhere(companyId: string, startDate?: Date, endDate?: Date) {
  const where: any = { companyId };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }
  return where;
}
