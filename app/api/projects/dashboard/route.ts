import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_DASHBOARD");
    if (rbacGuard) return rbacGuard;

    const now = new Date();

    const projects = await prisma.project.findMany({
      where: { companyId },
      include: {
        tasks: true
      }
    });

    let activeProjects = 0;
    let completedProjects = 0;
    let delayedProjects = 0;
    let totalProgress = 0;
    let totalBudget = 0;
    let totalCost = 0;

    projects.forEach(p => {
      if (p.status === "Active") activeProjects++;
      if (p.status === "Completed") completedProjects++;
      
      if (p.status !== "Completed" && p.status !== "Cancelled" && p.endDate && new Date(p.endDate) < now) {
        delayedProjects++;
      }

      if (p.status === "Active") {
        totalProgress += (p.progress || 0);
      }

      totalBudget += Number(p.estimatedBudget || 0);
      totalCost += Number(p.actualCost || 0);
    });

    const averageProgress = activeProjects > 0 ? (totalProgress / activeProjects).toFixed(1) : 0;
    const budgetUsage = totalBudget > 0 ? ((totalCost / totalBudget) * 100).toFixed(1) : 0;

    // Upcoming Deadlines (Projects due in next 7 days or overdue, not completed)
    const upcomingDeadlines = projects
      .filter(p => p.status !== "Completed" && p.status !== "Cancelled" && p.endDate)
      .map(p => ({
        id: p.id,
        name: p.name,
        type: "Project",
        date: p.endDate
      }))
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
      .slice(0, 5);

    // Recent Activity
    const recentActivity = await prisma.projectActivity.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        performedBy: { select: { name: true } },
        project: { select: { name: true } }
      }
    });

    return NextResponse.json({
      metrics: {
        activeProjects,
        completedProjects,
        delayedProjects,
        averageProgress,
        budgetUsage,
        totalBudget,
        totalCost
      },
      upcomingDeadlines,
      recentActivity
    });
  } catch (error) {
    console.error("GET Projects Dashboard Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
