import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { getCompanyId } from "@/lib/company/companyFilter";

async function resolveEmployee(idParam: string, companyId: string) {
  const decodedId = decodeURIComponent(idParam);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);

  if (isUUID) {
    return prisma.employee.findFirst({
      where: { id: decodedId, companyId },
      include: { workShift: true }
    });
  }

  // Try matching by employeeId first
  let emp = await prisma.employee.findFirst({
    where: { employeeId: decodedId, companyId },
    include: { workShift: true }
  });

  if (!emp) {
    const searchName = decodedId.replace(/_/g, ' ').toLowerCase();
    const employees = await prisma.employee.findMany({
      where: { companyId },
      include: { workShift: true }
    });
    emp = employees.find(e => `${e.firstName} ${e.lastName}`.trim().toLowerCase() === searchName) || null;
  }

  return emp;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const employee = await resolveEmployee(id, companyId);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Also fetch company default settings to show fallback shift
    const compSetting = await prisma.companySetting.findUnique({
      where: { companyId },
    });
    const config = await prisma.attendanceConfig.findFirst({
      where: { companyId },
    });

    const defaultShift = {
      startTime: config?.shiftStart || compSetting?.shiftStartTime || "09:30",
      endTime: config?.shiftEnd || compSetting?.shiftEndTime || "18:00",
      gracePeriod: config?.gracePeriod ?? compSetting?.gracePeriodMinutes ?? 0,
      breakTime: 60,
    };

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department,
        designation: employee.designation,
        shift: employee.shift,
      },
      hasCustomDuty: !!employee.workShift,
      customDuty: employee.workShift ? {
        id: employee.workShift.id,
        name: employee.workShift.name,
        startTime: employee.workShift.startTime,
        endTime: employee.workShift.endTime,
        gracePeriod: employee.workShift.gracePeriod,
        breakTime: employee.workShift.breakTime,
        nightShift: employee.workShift.nightShift,
        isActive: employee.workShift.isActive,
      } : null,
      defaultShift,
    });
  } catch (error: any) {
    console.error("Custom duty GET error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const employee = await resolveEmployee(id, companyId);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const body = await request.json();
    const { startTime, endTime, gracePeriod, breakTime, nightShift, name } = body;

    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Start time and end time are required." }, { status: 400 });
    }

    const shiftName = name?.trim() || `Custom Duty - ${employee.employeeId}`;

    const workShift = await prisma.workShift.upsert({
      where: {
        companyId_name: {
          companyId,
          name: shiftName,
        },
      },
      update: {
        startTime: String(startTime),
        endTime: String(endTime),
        gracePeriod: Number(gracePeriod) || 0,
        breakTime: Number(breakTime) || 0,
        nightShift: Boolean(nightShift),
        isActive: true,
      },
      create: {
        companyId,
        name: shiftName,
        startTime: String(startTime),
        endTime: String(endTime),
        gracePeriod: Number(gracePeriod) || 0,
        breakTime: Number(breakTime) || 0,
        nightShift: Boolean(nightShift),
        isActive: true,
      },
    });

    const updatedEmployee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        workShiftId: workShift.id,
        shift: `${startTime} - ${endTime}`,
      },
      include: {
        workShift: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Custom duty schedule configured successfully.",
      customDuty: updatedEmployee.workShift,
      employee: {
        id: updatedEmployee.id,
        employeeId: updatedEmployee.employeeId,
        fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
        shift: updatedEmployee.shift,
      },
    });
  } catch (error: any) {
    console.error("Custom duty POST error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return POST(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const employee = await resolveEmployee(id, companyId);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        workShiftId: null,
        shift: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Custom duty reset to company default shift.",
    });
  } catch (error: any) {
    console.error("Custom duty DELETE error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
