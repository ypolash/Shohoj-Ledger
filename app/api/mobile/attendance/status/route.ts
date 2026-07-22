import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireModule } from "@/lib/modules/moduleGuard";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  const rbacGuard = await requirePermission("ATTENDANCE_VIEW");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ATTENDANCE");
  if (moduleGuard) return moduleGuard;

  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "employeeId is required" },
        { status: 400 }
      );
    }

    const serverTime = new Date();
    const dateStr = serverTime.toISOString().split("T")[0];
    const today = new Date(dateStr);

    const employee = await prisma.employee.findUnique({
      where: { ...(await withCompany()), employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found." },
        { status: 404 }
      );
    }

    const isFriday = today.getDay() === 5;

    const attendance = await prisma.attendance.findFirst({
      where: { ...(await withCompany()),
        employeeId: employee.id,
        date: today,
      },
    });

    let currentStatus = attendance?.status;
    if (!currentStatus) {
      currentStatus = isFriday ? "WEEKLY_OFF" : "PENDING";
    }

    return NextResponse.json({
      success: true,
      checkInTime: attendance?.checkInTime || null,
      checkOutTime: attendance?.checkOutTime || null,
      status: currentStatus,
    });

  } catch (error) {
    console.error("Attendance status error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
