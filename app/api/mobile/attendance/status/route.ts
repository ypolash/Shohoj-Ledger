import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

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

    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found." },
        { status: 404 }
      );
    }

    const serverTime = new Date();
    const dhakaTimeString = serverTime.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const currentDhakaTime = new Date(dhakaTimeString);

    const dateStr = currentDhakaTime.getFullYear() + "-" +
                    String(currentDhakaTime.getMonth() + 1).padStart(2, '0') + "-" + 
                    String(currentDhakaTime.getDate()).padStart(2, '0');
    const today = new Date(dateStr);
    const utcDateStr = serverTime.toISOString().split("T")[0];
    const utcToday = new Date(utcDateStr);

    const isFriday = currentDhakaTime.getDay() === 5;

    // Look for today's attendance matching either Dhaka date, UTC date, or today's timestamp range
    const startOfServerDay = new Date(serverTime);
    startOfServerDay.setHours(0, 0, 0, 0);
    const endOfServerDay = new Date(serverTime);
    endOfServerDay.setHours(23, 59, 59, 999);

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

    let currentStatus = attendance?.status;
    if (!currentStatus) {
      currentStatus = isFriday ? "WEEKLY_OFF" : "PENDING";
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

