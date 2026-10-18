import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId is required" },
        { status: 400 }
      );
    }

    // If browser session exists, enforce employee ownership
    const session = await getSession();
    if (session?.user && session.user.loginType === "EMPLOYEE" && session.user.employeeId && session.user.employeeId !== employeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeId },
          { id: employeeId },
        ],
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const attendances = await prisma.attendance.findMany({
      where: { employeeId: employee.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 30,
    });

    const breakLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: employee.id,
        OR: [
          { type: { contains: "Break", mode: "insensitive" } },
          { type: { contains: "Lunch", mode: "insensitive" } },
          { comments: { contains: "TIMER_CONFIG" } },
          { comments: { contains: "Short Break" } },
          { comments: { contains: "Lunch" } },
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    const findBreakForDate = (dateVal: any) => {
      if (!dateVal) return null;
      try {
        const d = new Date(dateVal);
        const targetDateStr = d.toISOString().slice(0, 10);
        return breakLeaves.find((bl) => {
          const blDate = bl.startDate || bl.createdAt;
          if (!blDate) return false;
          return new Date(blDate).toISOString().slice(0, 10) === targetDateStr;
        });
      } catch {
        return null;
      }
    };

    const history = attendances.map((record) => {
      let totalWorkingMinutes = record.totalWorkingMinutes || 0;
      if (record.checkInTime && record.checkOutTime && !totalWorkingMinutes) {
        const diffMs = new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime();
        totalWorkingMinutes = Math.floor(diffMs / 1000 / 60);
      }

      const dayBreak = findBreakForDate(record.date || record.checkInTime);
      let lunchBreakStart: string | null = null;
      let lunchBreakEnd: string | null = null;
      let lunchBreakMinutes: number | null = null;
      let lunchBreakStatus: string | null = null;

      if (dayBreak) {
        lunchBreakStart = dayBreak.startDate ? dayBreak.startDate.toISOString() : (dayBreak.createdAt ? dayBreak.createdAt.toISOString() : null);
        lunchBreakEnd = dayBreak.endDate ? dayBreak.endDate.toISOString() : null;
        lunchBreakStatus = dayBreak.status;
        if (dayBreak.startDate && dayBreak.endDate) {
          lunchBreakMinutes = Math.max(1, Math.round((new Date(dayBreak.endDate).getTime() - new Date(dayBreak.startDate).getTime()) / 60000));
        }
      }

      return {
        id: record.id,
        employeeId: employee.employeeId,
        date: record.date ? record.date.toISOString() : null,
        checkInTime: record.checkInTime ? record.checkInTime.toISOString() : null,
        checkOutTime: record.checkOutTime ? record.checkOutTime.toISOString() : null,
        status: record.status,
        totalWorkingMinutes,
        isLate: record.isLate || record.status === "LATE" || (record.lateMinutes || 0) > 0,
        lateMinutes: record.lateMinutes || 0,
        createdAt: record.createdAt ? record.createdAt.toISOString() : null,
        lunchBreakStart,
        lunchBreakEnd,
        lunchBreakMinutes,
        lunchBreakStatus,
      };
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error("Attendance history error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

