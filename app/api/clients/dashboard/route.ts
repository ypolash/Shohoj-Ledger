import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_CLIENTS");
    if (rbacGuard) return rbacGuard;

    const clients = await prisma.client.findMany({
      where: { companyId },
      include: {
        projects: { select: { estimatedBudget: true, actualCost: true, status: true } },
        leads: { select: { expectedValue: true, status: true } }
      }
    });

    let activeClients = 0;
    let inactiveClients = 0;
    let newClients = 0; // Created in last 30 days
    let totalProjects = 0;
    let totalRevenue = 0; // Sum of completed/active project actual costs/budgets or closed leads. We will use Lead expectedValue for "Won" + Project actualCost

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    clients.forEach(c => {
      if (c.status === "ACTIVE") activeClients++;
      if (c.status === "INACTIVE") inactiveClients++;
      if (new Date(c.createdAt) > thirtyDaysAgo) newClients++;

      totalProjects += c.projects.length;

      c.projects.forEach(p => {
        totalRevenue += Number(p.actualCost || 0);
      });
      c.leads.forEach(l => {
        if (l.status === "Won") {
          totalRevenue += Number(l.expectedValue || 0);
        }
      });
    });

    // Recent Activity
    const recentActivity = await prisma.clientActivity.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        performedBy: { select: { name: true } },
        client: { select: { name: true } }
      }
    });

    return NextResponse.json({
      metrics: {
        activeClients,
        inactiveClients,
        newClients,
        totalProjects,
        totalRevenue,
      },
      recentActivity
    });
  } catch (error) {
    console.error("GET Clients Dashboard Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
