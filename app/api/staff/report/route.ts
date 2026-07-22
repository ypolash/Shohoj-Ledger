import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

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
