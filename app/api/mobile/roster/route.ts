import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getNowInTimezone } from "@/lib/attendance";
import { getEffectiveDutySchedule } from "@/lib/hr/dutyResolver";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let employeeId = searchParams.get("employeeId");

    const session = await getSession();
    if (session?.user) {
      if (session.user.loginType === "EMPLOYEE") {
        employeeId = session.user.employeeId || session.user.id;
      } else if (!employeeId && session.user.employeeId) {
        employeeId = session.user.employeeId;
      }
    }

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "employeeId is required" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeId },
          { id: employeeId },
        ],
      },
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

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    const timezone = employee.company?.settings?.timezone || "Asia/Dhaka";
    const { dateStr: todayDateStr, todayDateOnly: today } = getNowInTimezone(timezone);

    // Fetch rosters from 7 days ago to 60 days ahead
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
      customDuty: employee.workShift ? {
        id: employee.workShift.id,
        name: employee.workShift.name,
        startTime: employee.workShift.startTime,
        endTime: employee.workShift.endTime,
        gracePeriod: employee.workShift.gracePeriod,
        breakTime: employee.workShift.breakTime,
        nightShift: employee.workShift.nightShift,
        isCustom: true,
        dutyHoursFormatted: `${employee.workShift.startTime} - ${employee.workShift.endTime}`,
      } : null,
    });
  } catch (error: any) {
    console.error("Mobile Duty Roster GET error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
