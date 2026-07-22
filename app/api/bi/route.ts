import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_ANALYTICS");
    if (rbacGuard) return rbacGuard;

    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") || "ALL"; // ALL, TODAY, WEEK, MONTH, YEAR

    let dateFilter = {};
    const now = new Date();
    
    if (filter === "TODAY") {
      const startOfDay = new Date(now.setHours(0,0,0,0));
      dateFilter = { gte: startOfDay };
    } else if (filter === "WEEK") {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0,0,0,0);
      dateFilter = { gte: startOfWeek };
    } else if (filter === "MONTH") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { gte: startOfMonth };
    } else if (filter === "YEAR") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateFilter = { gte: startOfYear };
    }

    // Run all independent aggregations concurrently for maximum efficiency
    const [
      ledgers, 
      employees, 
      attendanceToday, 
      leads, 
      clients, 
      projects,
      tasks
    ] = await Promise.all([
      // Financials (Ledger)
      prisma.ledgerEntry.findMany({ 
        where: Object.keys(dateFilter).length ? { companyId, date: dateFilter } : { companyId },
        select: { accountType: true, debit: true, credit: true, date: true }
      }),
      // HR: Employees
      prisma.employee.findMany({ 
        where: { companyId },
        select: { status: true, basicSalary: true, createdAt: true }
      }),
      // HR: Attendance (Always today for snapshot)
      prisma.attendance.findMany({
        where: { companyId, date: { gte: new Date(new Date().setHours(0,0,0,0)) } },
        select: { status: true, isLate: true }
      }),
      // CRM: Leads
      prisma.lead.findMany({
        where: Object.keys(dateFilter).length ? { companyId, createdAt: dateFilter } : { companyId },
        select: { status: true, expectedValue: true, createdAt: true }
      }),
      // CRM: Clients
      prisma.client.findMany({
        where: { companyId },
        select: { status: true, createdAt: true }
      }),
      // Projects
      prisma.project.findMany({
        where: Object.keys(dateFilter).length ? { companyId, createdAt: dateFilter } : { companyId },
        select: { status: true, estimatedBudget: true, actualCost: true }
      }),
      // Tasks
      prisma.task.findMany({
        where: Object.keys(dateFilter).length ? { companyId, createdAt: dateFilter } : { companyId },
        select: { status: true }
      })
    ]);

    // Async Audit Logging (Don't await it to save MS)
    prisma.reportAudit.create({
      data: {
        companyId,
        userId: session.user.id,
        reportName: "EXECUTIVE_DASHBOARD",
        action: "GENERATED",
        filters: { filter }
      }
    }).catch(e => console.error("BI Audit Error:", e));

    // --- AGGREGATE FINANCIALS ---
    let totalRevenue = 0;
    let totalExpenses = 0;
    
    // Group Revenue by month for chart (last 6 months)
    const revenueTrend: Record<string, number> = {};
    const expenseTrend: Record<string, number> = {};

    ledgers.forEach(l => {
      const monthYear = `${l.date.getFullYear()}-${String(l.date.getMonth()+1).padStart(2,'0')}`;
      if (l.accountType === "INCOME") {
        totalRevenue += Number(l.credit) - Number(l.debit);
        revenueTrend[monthYear] = (revenueTrend[monthYear] || 0) + (Number(l.credit) - Number(l.debit));
      } else if (l.accountType === "EXPENSE") {
        totalExpenses += Number(l.debit) - Number(l.credit);
        expenseTrend[monthYear] = (expenseTrend[monthYear] || 0) + (Number(l.debit) - Number(l.credit));
      }
    });

    const netProfit = totalRevenue - totalExpenses;

    // --- AGGREGATE HR ---
    const totalEmployees = employees.length;
    let salaryCost = 0;
    employees.forEach(e => {
      if (e.status === "ACTIVE") salaryCost += Number(e.basicSalary || 0);
    });

    let presentToday = 0;
    let absentToday = 0;
    let lateToday = 0;
    attendanceToday.forEach(a => {
      if (a.status === "PRESENT") presentToday++;
      if (a.status === "ABSENT") absentToday++;
      if (a.isLate) lateToday++;
    });

    // --- AGGREGATE CRM ---
    const totalLeads = leads.length;
    let wonLeads = 0;
    let lostLeads = 0;
    leads.forEach(l => {
      if (l.status === "Won") wonLeads++;
      if (l.status === "Lost") lostLeads++;
    });
    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;
    const activeClients = clients.filter(c => c.status === "ACTIVE").length;

    // --- AGGREGATE PROJECTS ---
    const totalProjects = projects.length;
    let runningProjects = 0;
    let completedProjects = 0;
    let projectBudget = 0;
    let projectCost = 0;

    projects.forEach(p => {
      if (p.status === "Active") runningProjects++;
      if (p.status === "Completed") completedProjects++;
      projectBudget += Number(p.estimatedBudget || 0);
      projectCost += Number(p.actualCost || 0);
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "Completed").length;

    // FORMAT CHART DATA
    const chartLabels = Object.keys(revenueTrend).sort();
    const lineChartData = {
      labels: chartLabels,
      datasets: [
        { label: "Revenue", data: chartLabels.map(l => revenueTrend[l] || 0), borderColor: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.1)" },
        { label: "Expenses", data: chartLabels.map(l => expenseTrend[l] || 0), borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.1)" }
      ]
    };

    const donutChartData = {
      labels: ["Running", "Completed", "Delayed", "Draft"],
      datasets: [{
        data: [
          runningProjects,
          completedProjects,
          projects.filter(p => p.status === "Delayed").length,
          projects.filter(p => p.status === "Draft").length,
        ],
        backgroundColor: ["#3b82f6", "#10b981", "#ef4444", "#9ca3af"]
      }]
    };

    return NextResponse.json({
      financials: { totalRevenue, totalExpenses, netProfit },
      hr: { totalEmployees, salaryCost, presentToday, absentToday, lateToday },
      crm: { totalLeads, wonLeads, lostLeads, conversionRate, activeClients },
      projects: { totalProjects, runningProjects, completedProjects, projectBudget, projectCost, totalTasks, completedTasks },
      charts: {
        lineChartData,
        donutChartData
      }
    });
  } catch (error) {
    console.error("GET BI Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
