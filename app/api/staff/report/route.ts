import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        attendances: true
      }
    });

    const report = employees.map(emp => {
      let totalPresent = 0;
      let totalLate = 0;
      let totalAbsent = 0;
      let totalWorkedMinutes = 0;
      let totalOvertime = 0;
      let totalPunishment = 0;

      emp.attendances.forEach(att => {
        if (att.status === "PRESENT") totalPresent++;
        if (att.status === "LATE") {
          totalPresent++;
          totalLate++;
        }
        if (att.status === "OFF_DAY_WORK") totalPresent++;
        if (att.status === "ABSENT") totalAbsent++;

        totalWorkedMinutes += (att.totalWorkingMinutes || 0);
        totalOvertime += (att.overtimeMinutes || 0);
        totalPunishment += Number(att.punishmentAmount || 0);
      });

      return {
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        totalPresent,
        totalLate,
        totalAbsent,
        totalWorkedHours: Math.floor(totalWorkedMinutes / 60),
        totalOvertime: Math.floor(totalOvertime / 60),
        totalPunishment
      };
    });

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
