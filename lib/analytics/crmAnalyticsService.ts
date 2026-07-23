import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { calculateCustomerBalance } from "@/lib/crm/customerPaymentService";

/**
 * Returns a high-level executive summary of CRM performance.
 */
export async function getExecutiveDashboard(companyId: string) {
  const [
    totalCustomers,
    activeCustomers,
    totalLeads,
    qualifiedLeads,
    openOpportunities,
    salesOrders,
    deliveries,
    returns
  ] = await Promise.all([
    prisma.customer.count({ where: { companyId } }),
    prisma.customer.count({ where: { companyId, status: "ACTIVE" } }),
    prisma.lead.count({ where: { companyId } }),
    prisma.lead.count({ where: { companyId, status: "QUALIFIED" } }),
    prisma.opportunity.count({ where: { companyId, status: "OPEN" } }),
    prisma.salesOrder.count({ where: { companyId } }),
    prisma.deliveryOrder.count({ where: { companyId } }),
    prisma.customerReturn.count({ where: { companyId } })
  ]);

  const pipelineValue = await getRevenuePipeline(companyId);
  const outstandingBalance = await getCustomerOutstanding(companyId);
  const acceptedQuotations = await prisma.quotation.count({ where: { companyId, status: "ACCEPTED" } });

  return {
    overview: {
      totalCustomers,
      activeCustomers,
      totalLeads,
      qualifiedLeads,
      openOpportunities,
      pipelineValue,
      acceptedQuotations,
      salesOrders,
      deliveries,
      returns,
      outstandingBalance
    },
    performance: await getSalesPerformance(companyId)
  };
}

/**
 * Returns metrics specifically for the Sales Team performance.
 */
export async function getSalesDashboard(companyId: string) {
  const topSalespersons = await getTopSalespersons(companyId);
  const conversionRates = await getConversionRates(companyId);

  return {
    topPerformers: topSalespersons,
    conversion: conversionRates,
    pipeline: await getRevenuePipeline(companyId)
  };
}

export async function getCustomerDashboard(companyId: string) {
  return {
    growth: await getCustomerGrowth(companyId),
    retention: await getCustomerRetention(companyId),
    topCustomers: await getTopCustomers(companyId),
    outstanding: await getCustomerOutstanding(companyId)
  };
}

export async function getLeadDashboard(companyId: string) {
  const leadsByStatus = await prisma.lead.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { id: true }
  });
  return { leadsByStatus };
}

export async function getOpportunityDashboard(companyId: string) {
  const opsByStage = await prisma.opportunity.groupBy({
    by: ['stageId'],
    where: { companyId },
    _count: { id: true },
    _sum: { expectedValue: true }
  });
  return { pipelineByStage: opsByStage };
}

export async function getQuotationDashboard(companyId: string) {
  const byStatus = await prisma.quotation.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { id: true },
    _sum: { totalAmount: true }
  });
  return { quotations: byStatus };
}

export async function getSalesOrderDashboard(companyId: string) {
  const byStatus = await prisma.salesOrder.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { id: true },
    _sum: { totalAmount: true }
  });
  return { salesOrders: byStatus };
}

export async function getDeliveryDashboard(companyId: string) {
  const byStatus = await prisma.deliveryOrder.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { id: true }
  });
  return { deliveries: byStatus };
}

export async function getReturnDashboard(companyId: string) {
  const byStatus = await prisma.customerReturn.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { id: true }
  });
  return { returns: byStatus };
}

export async function getPaymentDashboard(companyId: string) {
  const byStatus = await prisma.customerPayment.groupBy({
    by: ['status'],
    where: { companyId },
    _sum: { amount: true, unallocatedAmount: true }
  });
  return { payments: byStatus };
}

export async function getCommissionDashboard(companyId: string) {
  const byStatus = await prisma.salesCommission.groupBy({
    by: ['status'],
    where: { companyId },
    _sum: { commissionAmount: true }
  });
  return { commissions: byStatus };
}

// ==========================================
// DEEP METRICS (Reusable internal functions)
// ==========================================

export async function getSalesPerformance(companyId: string) {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0,0,0,0);

  const thisMonthSales = await prisma.salesOrder.aggregate({
    where: { companyId, orderDate: { gte: currentMonth }, status: { not: "CANCELLED" } },
    _sum: { totalAmount: true }
  });

  return {
    thisMonthRevenue: thisMonthSales._sum.totalAmount || 0
  };
}

export async function getCustomerGrowth(companyId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newCustomers = await prisma.customer.count({
    where: { companyId, createdAt: { gte: thirtyDaysAgo } }
  });

  return {
    newCustomersLast30Days: newCustomers
  };
}

export async function getRevenuePipeline(companyId: string) {
  const openOps = await prisma.opportunity.aggregate({
    where: { companyId, status: "OPEN" },
    _sum: { expectedValue: true }
  });
  return openOps._sum.expectedValue || 0;
}

export async function getConversionRates(companyId: string) {
  const totalLeads = await prisma.lead.count({ where: { companyId } });
  const qualifiedLeads = await prisma.lead.count({ where: { companyId, status: "QUALIFIED" } });
  const leadConversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

  return {
    totalLeads,
    qualifiedLeads,
    leadConversionRate
  };
}

export async function getTopCustomers(companyId: string) {
  const top = await prisma.salesOrder.groupBy({
    by: ['customerId'],
    where: { companyId, status: { not: "CANCELLED" } },
    _sum: { totalAmount: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: 10
  });

  // Hydrate with names
  const customerIds = top.map(t => t.customerId);
  const customers = await prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true }});
  
  return top.map(t => ({
    customerId: t.customerId,
    name: customers.find(c => c.id === t.customerId)?.name || "Unknown",
    totalSales: t._sum.totalAmount
  }));
}

export async function getTopSalespersons(companyId: string) {
  const top = await prisma.salesOrder.groupBy({
    by: ['createdById'],
    where: { companyId, status: { not: "CANCELLED" } },
    _sum: { totalAmount: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: 10
  });

  const userIds = top.map(t => t.createdById);
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true }});

  return top.map(t => ({
    userId: t.createdById,
    name: users.find(u => u.id === t.createdById)?.name || "Unknown",
    totalSales: t._sum.totalAmount
  }));
}

export async function getCustomerOutstanding(companyId: string) {
  // Aggregate unallocated payments mapping (as advance)
  // For total outstanding, we also need to sum unpaid invoices in future phases.
  // For Phase 1.3, we will summarize Advance Balances from CustomerPayments.
  const payments = await prisma.customerPayment.aggregate({
    where: { companyId, status: { in: ["POSTED", "PARTIALLY_ALLOCATED"] } },
    _sum: { unallocatedAmount: true }
  });

  return {
    totalAdvances: payments._sum.unallocatedAmount || 0,
    totalReceivables: "Requires Phase 4 Invoicing Engine for AR sum."
  };
}

export async function getCustomerRetention(companyId: string) {
  const total = await prisma.customer.count({ where: { companyId } });
  const active = await prisma.customer.count({ where: { companyId, status: "ACTIVE" } });
  
  return {
    retentionRate: total > 0 ? (active / total) * 100 : 0
  };
}

export async function getCustomerAcquisition(companyId: string) {
  // Mock logic: Grouping customers by LeadSource
  return await prisma.customer.groupBy({
    by: ['status'], // Since LeadSource tracking on customer requires a relation, we group by status to show API shape
    where: { companyId },
    _count: { id: true }
  });
}
