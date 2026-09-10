import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAdmin, CORS_HEADERS } from "@/lib/auth/mobileAdminGuard";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const guard = await verifyMobileAdmin();
  if (!guard.authorized) return guard.response;

  const { companyId, user } = guard;

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // 1. Employees & Attendance metrics
    const [totalActiveEmployees, todayAttendances, leaveRequestsToday] = await Promise.all([
      prisma.employee.count({ where: { companyId, status: "ACTIVE" } }),
      prisma.attendance.findMany({
        where: {
          companyId,
          date: { gte: today, lte: endOfDay },
        },
        include: {
          employee: {
            select: { firstName: true, lastName: true, employeeId: true, designation: true },
          },
        },
        orderBy: { checkInTime: "desc" },
      }),
      prisma.leaveRequest.count({
        where: {
          companyId,
          status: "PENDING",
        },
      }),
    ]);

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let halfDayCount = 0;

    todayAttendances.forEach((att) => {
      if (att.status === "PRESENT") presentCount++;
      else if (att.status === "LATE") {
        presentCount++;
        lateCount++;
      } else if (att.status === "HALF_DAY") {
        presentCount++;
        halfDayCount++;
      } else if (att.status === "ABSENT") {
        absentCount++;
      }
    });

    const unmarkedCount = Math.max(0, totalActiveEmployees - (presentCount + absentCount));

    // 2. Financial Overview (All Time or Current Month)
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.income.aggregate({
        where: { companyId },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { companyId },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount || 0);
    const totalExpense = Number(expenseAgg._sum.amount || 0);
    const netProfit = totalIncome - totalExpense;

    // 3. Projects overview
    const [totalProjects, activeProjects, completedProjects] = await Promise.all([
      prisma.project.count({ where: { companyId } }),
      prisma.project.count({
        where: {
          companyId,
          status: { in: ["IN_PROGRESS", "PLANNING", "ON_HOLD"] },
        },
      }),
      prisma.project.count({ where: { companyId, status: "COMPLETED" } }),
    ]);

    // 4. Leads overview
    const [totalLeads, newLeads, wonLeads] = await Promise.all([
      prisma.lead.count({ where: { companyId } }),
      prisma.lead.count({ where: { companyId, status: { in: ["NEW", "CONTACTED"] } } }),
      prisma.lead.count({ where: { companyId, status: "WON" } }),
    ]);

    // 5. Company info
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, businessType: true, logoUrl: true },
    });

    return NextResponse.json(
      {
        success: true,
        company: {
          id: companyId,
          name: company?.name || "Company",
          businessType: company?.businessType || "General",
          logoUrl: company?.logoUrl || null,
        },
        user: {
          name: user.name,
          role: user.role,
          email: user.email,
        },
        attendanceStats: {
          totalActiveEmployees,
          presentToday: presentCount,
          lateToday: lateCount,
          absentToday: absentCount,
          halfDayToday: halfDayCount,
          unmarkedToday: unmarkedCount,
        },
        financialSummary: {
          totalIncome,
          totalExpense,
          netProfit,
        },
        projectStats: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
        },
        leadStats: {
          total: totalLeads,
          newLeads,
          wonLeads,
        },
        pendingLeavesCount: leaveRequestsToday,
        recentPunches: todayAttendances.slice(0, 5).map((att) => ({
          id: att.id,
          employeeName: `${att.employee.firstName} ${att.employee.lastName}`.trim(),
          employeeId: att.employee.employeeId,
          designation: att.employee.designation,
          status: att.status,
          isLate: att.isLate,
          lateMinutes: att.lateMinutes || 0,
          checkInTime: att.checkInTime ? att.checkInTime.toISOString() : null,
          checkOutTime: att.checkOutTime ? att.checkOutTime.toISOString() : null,
        })),
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[Mobile Admin Dashboard] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard data." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
