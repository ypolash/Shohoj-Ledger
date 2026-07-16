import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Find the employee by their string ID (e.g., "EMP-1001")
    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Fetch the latest 30 attendance records
    const attendances = await prisma.attendance.findMany({
      where: { employeeId: employee.id },
      orderBy: { checkInTime: "desc" },
      take: 30,
    });

    // Map to the requested JSON format
    const history = attendances.map((record) => {
      let totalWorkingMinutes = record.totalWorkingMinutes || 0;
      if (record.checkInTime && record.checkOutTime && !totalWorkingMinutes) {
        const diffMs = new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime();
        totalWorkingMinutes = Math.floor(diffMs / 1000 / 60);
      }

      return {
        id: record.id,
        employeeId: employee.employeeId,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        totalWorkingMinutes,
        isLate: record.isLate || record.status === "LATE" || record.lateMinutes > 0,
        lateMinutes: record.lateMinutes,
        createdAt: record.createdAt,
      };
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error("Attendance history error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
