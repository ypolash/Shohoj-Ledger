import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";
import { getNowInTimezone } from "@/lib/attendance";
import { getEffectiveDutySchedule } from "@/lib/hr/dutyResolver";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

export async function GET(request: Request) {
  try {
    const employee = await resolveEssEmployee(request);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: ESS_CORS_HEADERS });
    }

    const empWithShift = await prisma.employee.findUnique({
      where: { id: employee.id },
      include: {
        workShift: true,
        company: {
          include: {
            settings: true,
            attendanceConfigs: true,
          }
        }
      }
    });

    const timezone = empWithShift?.company?.settings?.timezone || "Asia/Dhaka";
    const { dateStr: todayDateStr, todayDateOnly: today } = getNowInTimezone(timezone);

    const pastWindow = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const futureWindow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    const rosters = await prisma.attendanceRoster.findMany({
      where: {
        employeeId: employee.id,
        date: {
          gte: pastWindow,
          lte: futureWindow,
        },
        status: { not: "CANCELLED" },
      },
      include: {
        workShift: true,
      },
      orderBy: { date: "asc" },
    });

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    };

    const formattedRosters = rosters.map((r) => {
      const rDateStr = r.date.toISOString().split("T")[0];
      const isToday = rDateStr === todayDateStr;
      const startTime = r.startTime || r.workShift?.startTime || "09:00";
      const endTime = r.endTime || r.workShift?.endTime || "18:00";
      const gracePeriod = r.gracePeriod ?? r.workShift?.gracePeriod ?? 15;
      const breakTime = r.workShift?.breakTime ?? 60;
      const nightShift = r.workShift?.nightShift ?? false;
      const shiftName = r.workShift?.name || "Assigned Duty Roster";

      return {
        id: r.id,
        date: rDateStr,
        dateFormatted: new Intl.DateTimeFormat("en-US", dateOptions).format(new Date(`${rDateStr}T12:00:00.000Z`)),
        startTime,
        endTime,
        gracePeriod,
        breakTime,
        nightShift,
        shiftName,
        note: r.note || null,
        status: r.status,
        isToday,
        dutyHoursFormatted: `${startTime} - ${endTime}`,
      };
    });

    const todayRoster = formattedRosters.find((r) => r.isToday) || null;
    const { dutySchedule: effectiveDutyToday } = await getEffectiveDutySchedule(employee.id, employee.companyId);

    return NextResponse.json({
      success: true,
      rosters: formattedRosters,
      todayRoster,
      effectiveDutyToday,
      customDuty: empWithShift?.workShift ? {
        id: empWithShift.workShift.id,
        name: empWithShift.workShift.name,
        startTime: empWithShift.workShift.startTime,
        endTime: empWithShift.workShift.endTime,
        gracePeriod: empWithShift.workShift.gracePeriod,
        breakTime: empWithShift.workShift.breakTime,
        nightShift: empWithShift.workShift.nightShift,
        isCustom: true,
        dutyHoursFormatted: `${empWithShift.workShift.startTime} - ${empWithShift.workShift.endTime}`,
      } : null,
    }, { headers: ESS_CORS_HEADERS });
  } catch (error: any) {
    console.error("ESS Duty Roster GET error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
