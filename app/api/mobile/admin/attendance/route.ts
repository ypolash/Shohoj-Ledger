import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAdmin, CORS_HEADERS } from "@/lib/auth/mobileAdminGuard";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const guard = await verifyMobileAdmin();
  if (!guard.authorized) return guard.response;

  const { companyId } = guard;

  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const statusFilter = url.searchParams.get("status")?.trim();

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Fetch active employees
    const allEmployees = await prisma.employee.findMany({
      where: { companyId, status: "ACTIVE" },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        designation: true,
        department: true,
      },
      orderBy: { employeeId: "asc" },
    });

    // Fetch attendances for date
    const attendances = await prisma.attendance.findMany({
      where: {
        companyId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: true,
          },
        },
      },
      orderBy: { checkInTime: "asc" },
    });

    // Build map of employeeId -> attendance
    const attendanceMap = new Map<string, (typeof attendances)[0]>();
    attendances.forEach((att) => {
      attendanceMap.set(att.employeeId, att);
    });

    let present = 0;
    let late = 0;
    let absent = 0;
    let halfDay = 0;

    const roster = allEmployees.map((emp) => {
      const att = attendanceMap.get(emp.id);
      let status = "UNMARKED";
      let isLate = false;
      let lateMinutes = 0;
      let checkInTime: string | null = null;
      let checkOutTime: string | null = null;
      let locationNote: string | null = null;

      if (att) {
        status = att.status;
        isLate = att.isLate || false;
        lateMinutes = att.lateMinutes || 0;
        checkInTime = att.checkInTime ? att.checkInTime.toISOString() : null;
        checkOutTime = att.checkOutTime ? att.checkOutTime.toISOString() : null;
        locationNote = att.checkInLocation || null;

        if (status === "PRESENT") present++;
        else if (status === "LATE") {
          present++;
          late++;
        } else if (status === "HALF_DAY") {
          present++;
          halfDay++;
        } else if (status === "ABSENT") {
          absent++;
        }
      }

      return {
        employeeDbId: emp.id,
        employeeId: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`.trim(),
        designation: emp.designation || "Staff",
        department: emp.department || "General",
        status,
        isLate,
        lateMinutes,
        checkInTime,
        checkOutTime,
        locationNote,
      };
    });

    const unmarked = Math.max(0, allEmployees.length - (present + absent));

    // Optional status filter on roster
    const filteredRoster = statusFilter && statusFilter !== "ALL"
      ? roster.filter((item) => item.status === statusFilter)
      : roster;

    return NextResponse.json(
      {
        success: true,
        date: startOfDay.toISOString().split("T")[0],
        stats: {
          totalActiveEmployees: allEmployees.length,
          presentToday: present,
          lateToday: late,
          absentToday: absent,
          halfDayToday: halfDay,
          unmarkedToday: unmarked,
        },
        roster: filteredRoster,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[Mobile Admin Attendance] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance data." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
