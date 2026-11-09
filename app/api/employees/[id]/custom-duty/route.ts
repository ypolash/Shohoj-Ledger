import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { getCompanyId } from "@/lib/company/companyFilter";
import { parseDateTimeInTimezone } from "@/lib/attendance";

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

    // Check today's attendance record
    const timezone = compSetting?.timezone || "Asia/Dhaka";
    const now = new Date();
    const dateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: startOfDay, lte: endOfDay }
      }
    });

    const isHalfDayDuty = Boolean(
      employee.shift?.toLowerCase().includes("half day") ||
      employee.workShift?.name?.toLowerCase().includes("half day")
    );

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
        isHalfDayDuty,
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
        isHalfDay: employee.workShift.name?.toLowerCase().includes("half day") || false,
      } : null,
      defaultShift,
      todayAttendance: todayAttendance ? {
        id: todayAttendance.id,
        status: todayAttendance.status,
        checkInTime: todayAttendance.checkInTime,
        checkOutTime: todayAttendance.checkOutTime,
        reviewStatus: todayAttendance.reviewStatus,
      } : null,
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

    // 1. Action: Immediate Half Day Out / Short Sign-off for Today
    if (body.action === "HALF_DAY_OUT" || body.action === "TODAY_SIGN_OFF") {
      const compSetting = await prisma.companySetting.findUnique({
        where: { companyId },
        select: { timezone: true, shiftEndTime: true, shiftStartTime: true }
      });
      let timezone = compSetting?.timezone || "Asia/Dhaka";
      if (!timezone || timezone === "UTC" || timezone === "UTC / GMT") {
        timezone = "Asia/Dhaka";
      }
      try { Intl.DateTimeFormat(undefined, { timeZone: timezone }); } catch { timezone = "Asia/Dhaka"; }

      const now = new Date();
      const dateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(now);

      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

      // Target checkout time (e.g., "14:00" or current time)
      const targetTimeStr = body.checkOutTime || new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(now);

      const checkOutDate = parseDateTimeInTimezone(dateStr, targetTimeStr, timezone) || now;

      const reasonLabel = body.reason?.trim() || "Emergency departure permitted by HR (Half Day)";
      const note = body.note?.trim() ? `${reasonLabel} · ${body.note.trim()}` : reasonLabel;

      let attendanceRecord = await prisma.attendance.findFirst({
        where: {
          employeeId: employee.id,
          date: { gte: startOfDay, lte: endOfDay }
        }
      });

      if (attendanceRecord) {
        let totalWorkingMinutes = 240;
        if (attendanceRecord.checkInTime) {
          totalWorkingMinutes = Math.max(0, Math.floor((checkOutDate.getTime() - attendanceRecord.checkInTime.getTime()) / 60000));
        }
        attendanceRecord = await prisma.attendance.update({
          where: { id: attendanceRecord.id },
          data: {
            checkOutTime: checkOutDate,
            totalWorkingMinutes,
            status: "HALF_DAY",
            earlyLeaveMinutes: 0,
            reviewStatus: "PERMITTED_HALF_DAY",
            punishmentAmount: 0,
            punishmentReason: note,
          }
        });
      } else {
        const defaultStartStr = compSetting?.shiftStartTime || "09:30";
        const checkInDate = parseDateTimeInTimezone(dateStr, defaultStartStr, timezone) || checkOutDate;
        const totalWorkingMinutes = Math.max(0, Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / 60000));

        attendanceRecord = await prisma.attendance.create({
          data: {
            companyId,
            employeeId: employee.id,
            date: startOfDay,
            checkInTime: checkInDate,
            checkOutTime: checkOutDate,
            status: "HALF_DAY",
            totalWorkingMinutes,
            earlyLeaveMinutes: 0,
            reviewStatus: "PERMITTED_HALF_DAY",
            punishmentAmount: 0,
            punishmentReason: note,
          }
        });
      }

      // Record adjustment for audit trail
      try {
        await prisma.attendanceAdjustment.create({
          data: {
            attendanceId: attendanceRecord.id,
            employeeId: employee.id,
            type: "HALF_DAY_PERMIT",
            reason: note,
            status: "APPROVED",
          }
        });
      } catch (adjErr) {
        console.warn("Adjustment creation for half day permit:", adjErr);
      }

      // Send push notification
      if (employee.userId) {
        try {
          const { sendNotification } = await import("@/lib/notifications/notificationService");
          await sendNotification({
            companyId,
            userId: employee.userId,
            category: "HR",
            title: "🌓 Half Day Short Sign-off Approved",
            message: `Your early departure at ${targetTimeStr} has been authorized as a permitted Half Day (0 early leave penalty).`,
            priority: "NORMAL",
          });
        } catch (e) {
          console.error("Failed to send notification for half day sign off:", e);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Half-day short sign-off authorized at ${targetTimeStr} for ${employee.firstName} ${employee.lastName}.`,
        attendance: attendanceRecord
      });
    }

    // 2. Action: Configure Duty Schedule (Full-Day or Half-Day Duty for Short Sign-off)
    const { startTime, endTime, gracePeriod, breakTime, nightShift, name, isHalfDay } = body;

    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Start time and end time are required." }, { status: 400 });
    }

    const isHalfDayDuty = Boolean(isHalfDay) || (name && name.toLowerCase().includes("half day"));
    const defaultShiftName = isHalfDayDuty 
      ? `Half Day Duty - ${employee.employeeId}` 
      : `Custom Duty - ${employee.employeeId}`;
    const shiftName = name?.trim() || defaultShiftName;

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

    const shiftDisplay = isHalfDayDuty
      ? `${startTime} - ${endTime} (Half Day)`
      : `${startTime} - ${endTime}`;

    const updatedEmployee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        workShiftId: workShift.id,
        shift: shiftDisplay,
      },
      include: {
        workShift: true,
      },
    });

    if (updatedEmployee.userId) {
      try {
        const { sendNotification } = await import("@/lib/notifications/notificationService");
        await sendNotification({
          companyId,
          userId: updatedEmployee.userId,
          category: "HR",
          title: isHalfDayDuty ? "🌓 Half Day Duty Schedule Configured" : "⚡ Custom Duty Schedule Updated",
          message: isHalfDayDuty
            ? `Your duty has been set to Half Day (${startTime} - ${endTime}). Short sign-off at ${endTime} will be permitted without penalty.`
            : `Your duty shift has been configured to ${startTime} - ${endTime} (+${gracePeriod || 0}m grace period, ${breakTime || 0}m break).`,
          priority: "HIGH",
        });
      } catch (e) {
        console.error("Failed to send notification for custom duty update:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: isHalfDayDuty
        ? "Half-day duty schedule configured successfully. Short sign-off enabled."
        : "Custom duty schedule configured successfully.",
      customDuty: updatedEmployee.workShift,
      employee: {
        id: updatedEmployee.id,
        employeeId: updatedEmployee.employeeId,
        fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
        shift: updatedEmployee.shift,
        isHalfDayDuty,
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
