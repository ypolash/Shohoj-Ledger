import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_LEADS");
    if (rbacGuard) return rbacGuard;

    const [leads, salesOrders] = await Promise.all([
      prisma.lead.findMany({
        where: { companyId },
        include: {
          assignedTo: { select: { firstName: true, lastName: true } }
        }
      }),
      prisma.salesOrder.findMany({
        where: { companyId },
        include: {
          customer: { select: { id: true, name: true } },
          lines: { select: { id: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    let totalLeads = leads.length;
    let newLeads = 0;
    let qualifiedLeads = 0;
    let wonLeads = 0;
    let lostLeads = 0;
    let wonValue = 0;
    let pipelineValue = 0;

    const monthlyLeads: Record<string, number> = {};
    const salesPerformance: Record<string, { name: string; won: number; value: number }> = {};

    leads.forEach(l => {
      // Basic metrics
      if (l.status === "New") newLeads++;
      if (l.status === "Qualified") qualifiedLeads++;
      if (l.status === "Won") {
        wonLeads++;
        wonValue += Number(l.expectedValue);
        
        // Sales Performance
        if (l.assignedToId && l.assignedTo) {
          const empName = `${l.assignedTo.firstName} ${l.assignedTo.lastName}`;
          if (!salesPerformance[l.assignedToId]) {
            salesPerformance[l.assignedToId] = { name: empName, won: 0, value: 0 };
          }
          salesPerformance[l.assignedToId].won++;
          salesPerformance[l.assignedToId].value += Number(l.expectedValue);
        }
      } else if (l.status === "Lost") {
        lostLeads++;
      } else {
        pipelineValue += Number(l.expectedValue);
      }

      // Monthly Trend
      const monthKey = `${l.createdAt.getFullYear()}-${(l.createdAt.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthlyLeads[monthKey]) monthlyLeads[monthKey] = 0;
      monthlyLeads[monthKey]++;
    });

    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;
    
    // Sort Top Sales Persons
    const topSalesPersons = Object.values(salesPerformance)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Sales Order Metrics for Product CRM
    let totalOrders = salesOrders.length;
    let pendingOrders = 0;
    let deliveredOrders = 0;
    let ordersRevenue = 0;

    salesOrders.forEach(o => {
      const amt = Number(o.totalAmount || 0);
      ordersRevenue += amt;
      const s = (o.status || '').toUpperCase();
      if (s.includes('DELIVER') || s.includes('COMPLET')) {
        deliveredOrders++;
      } else if (!s.includes('CANCEL')) {
        pendingOrders++;
      }
    });

    const recentOrders = salesOrders.slice(0, 5).map(o => ({
      id: o.id,
      salesOrderNumber: o.salesOrderNumber || o.id.substring(0, 8),
      customerName: o.customer?.name || 'Customer',
      orderDate: o.orderDate,
      totalAmount: Number(o.totalAmount || 0),
      status: o.status,
      itemsCount: o.lines.length
    }));

    return NextResponse.json({
      metrics: {
        totalLeads,
        newLeads,
        qualifiedLeads,
        wonLeads,
        lostLeads,
        conversionRate,
        wonValue,
        pipelineValue,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        ordersRevenue,
      },
      recentOrders,
      charts: {
        monthlyLeads,
        topSalesPersons
      }
    });
  } catch (error) {
    console.error("GET CRM Dashboard Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
