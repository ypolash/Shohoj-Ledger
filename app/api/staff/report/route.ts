import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const attendances = await prisma.attendance.findMany({
      include: {
        employee: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    const report = attendances.map(att => ({
      employeeId: att.employee.employeeId,
      employeeName: `${att.employee.firstName} ${att.employee.lastName}`,
      date: att.date.toISOString(),
      status: att.status,
      lateMinutes: att.lateMinutes,
      earlyLeaveMinutes: att.earlyLeaveMinutes,
      workedHours: Math.floor((att.totalWorkingMinutes || 0) / 60),
      overtime: Math.floor((att.overtimeMinutes || 0) / 60),
      punishmentReason: att.punishmentReason,
      reviewStatus: att.reviewStatus,
      punishmentAmount: Number(att.punishmentAmount || 0)
    }));

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
