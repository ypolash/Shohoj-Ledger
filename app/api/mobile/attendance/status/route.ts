import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getNowInTimezone } from "@/lib/attendance";
import { getEffectiveDutySchedule } from "@/lib/hr/dutyResolver";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "employeeId is required" },
        { status: 400 }
      );
    }

    // If browser session exists, enforce employee ownership
    const session = await getSession();
    if (session?.user && session.user.loginType === "EMPLOYEE" && session.user.employeeId && session.user.employeeId !== employeeId) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
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
        { success: false, message: "Employee not found." },
        { status: 404 }
      );
    }

    const { now: serverTime, todayDateOnly: today } = getNowInTimezone();
    const utcDateStr = serverTime.toISOString().split("T")[0];
    const utcToday = new Date(`${utcDateStr}T00:00:00.000Z`);

    const dayOfWeek = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", weekday: "short" }).format(serverTime);
    const isFriday = dayOfWeek === "Fri";

    // Look for today's attendance matching either Dhaka date, UTC date, or today's timestamp range
    const startOfServerDay = today;
    const endOfServerDay = new Date(today.getTime() + (24 * 60 * 60 * 1000) - 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        OR: [
          { date: today },
          { date: utcToday },
          {
            checkInTime: {
              gte: startOfServerDay,
              lte: endOfServerDay,
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    const { dutySchedule } = await getEffectiveDutySchedule(employee.id, employee.companyId);

    let currentStatus = attendance?.status;
    if (!currentStatus) {
      // Check if employee has an approved leave request for today
      const approvedLeaveToday = await prisma.leaveRequest.findFirst({
        where: {
          employeeId: employee.id,
          companyId: employee.companyId,
          status: "APPROVED",
          startDate: { lte: endOfServerDay },
          endDate: { gte: startOfServerDay },
        }
      });

      if (approvedLeaveToday) {
        currentStatus = "LEAVE";
      } else {
        // If not on approved leave, check if duty shift has already finished today without check-in
        const shiftEndStr = dutySchedule?.endTime || "18:00";
        const [endHour, endMin] = shiftEndStr.split(":").map(Number);
        
        const timeFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Dhaka",
          hour: "numeric",
          minute: "numeric",
          hour12: false
        });
        const [currentHour, currentMin] = timeFormatter.format(serverTime).split(":").map(Number);
        const currentMins = (currentHour || 0) * 60 + (currentMin || 0);
        const shiftEndMins = (endHour || 18) * 60 + (endMin || 0);

        if (!isFriday && currentMins > shiftEndMins) {
          currentStatus = "ABSENT";
        } else {
          currentStatus = isFriday ? "WEEKLY_OFF" : "PENDING";
        }
      }
    }

    const checkInTimeIso = attendance?.checkInTime ? attendance.checkInTime.toISOString() : null;
    const checkOutTimeIso = attendance?.checkOutTime ? attendance.checkOutTime.toISOString() : null;

    return NextResponse.json({
      success: true,
      checkInTime: checkInTimeIso,
      checkOutTime: checkOutTimeIso,
      status: currentStatus,
      lateMinutes: attendance?.lateMinutes || 0,
      isLate: attendance?.isLate || false,
      dutySchedule,
      record: attendance ? {
        id: attendance.id,
        employeeId: employee.employeeId,
        date: attendance.date.toISOString(),
        checkInTime: checkInTimeIso,
        checkOutTime: checkOutTimeIso,
        status: currentStatus,
        lateMinutes: attendance.lateMinutes || 0,
        isLate: attendance.isLate || false,
        isCheckedIn: !!attendance.checkInTime && !attendance.checkOutTime,
        dutySchedule,
      } : null,
    });

  } catch (error) {
    console.error("Attendance status error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

