import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import * as os from 'os';

export async function GET() {
  try {
    const rbacGuard = await requirePermission("SYSTEM_ADMIN");
    if (rbacGuard) return rbacGuard;

    // Aggregate Platform Metrics (Bypassing companyId)
    const totalCompanies = await prisma.company.count();
    const totalUsers = await prisma.user.count();
    const totalEmployees = await prisma.employee.count();
    const totalProjects = await prisma.project.count();
    const activeCompanies = await prisma.company.count({ where: { status: "ACTIVE" } });
    
    // Server Metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = ((totalMem - freeMem) / totalMem * 100).toFixed(2);
    const cpuLoad = os.loadavg(); // Returns an array containing the 1, 5, and 15 minute load averages
    
    const dbStatus = "Connected";
    
    // Most recent backup
    const lastBackup = await prisma.systemBackup.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      metrics: {
        totalCompanies,
        activeCompanies,
        totalUsers,
        totalEmployees,
        totalProjects,
      },
      health: {
        cpuLoad1m: cpuLoad[0].toFixed(2),
        cpuLoad5m: cpuLoad[1].toFixed(2),
        cpuLoad15m: cpuLoad[2].toFixed(2),
        memoryUsagePercent: memUsage,
        totalMemoryGb: (totalMem / 1024 / 1024 / 1024).toFixed(2),
        databaseStatus: dbStatus,
        uptimeHours: (os.uptime() / 3600).toFixed(2),
      },
      lastBackup
    });
  } catch (error) {
    console.error("GET System Dashboard Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
