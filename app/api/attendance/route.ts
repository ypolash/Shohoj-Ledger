import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isWithinOfficeRadius } from '@/lib/gps';

import { requireModule } from "@/lib/modules/moduleGuard";
import { calculateAttendanceStatus, calculateEarlyLeaveStatus, parseDateTimeInTimezone, runOfficeOff } from "@/lib/attendance";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(request: Request) {
  const rbacGuard = await requirePermission("ATTENDANCE_VIEW");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ATTENDANCE");
  if (moduleGuard) return moduleGuard;

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');

  try {
    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";
    const companyFilter = await withCompany();

    // Auto-evaluate Office Off if configured and trigger time has arrived
    const effectiveCompanyId = companyIdForGuard || (companyFilter as any)?.companyId;
    if (effectiveCompanyId) {
      try {
        const attConfig: any = await (prisma.attendanceConfig as any).findFirst({
          where: { companyId: effectiveCompanyId }
        });
        if (attConfig?.autoOfficeOff) {
          const compSetting = await prisma.companySetting.findUnique({
            where: { companyId: effectiveCompanyId }
          });
          let timezone = compSetting?.timezone || "Asia/Dhaka";
          try { Intl.DateTimeFormat(undefined, { timeZone: timezone }); } catch { timezone = "Asia/Dhaka"; }
          const now = new Date();
          const currentTimeStr = new Intl.DateTimeFormat("en-GB", {
            timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false
          }).format(now);
          const todayStr = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit"
          }).format(now);

          const targetTime = attConfig.autoOfficeOffTime || attConfig.shiftEnd || "20:00";
          let executedToday = false;
          if (attConfig.lastOfficeOffRun) {
            const lastRunStr = new Intl.DateTimeFormat("en-CA", {
              timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit"
            }).format(new Date(attConfig.lastOfficeOffRun));
            if (lastRunStr === todayStr) executedToday = true;
          }

          if (currentTimeStr >= targetTime && !executedToday) {
            await runOfficeOff(effectiveCompanyId, {
              targetDate: todayStr,
              backfillPastDays: attConfig.autoBackfillPastDays || 30,
              source: "AUTO"
            });
          }
        }
      } catch (autoErr) {
        console.error("Auto Office Off execution check failed:", autoErr);
      }
    }

    // Include company attendances across ERP, mobile app, and legacy sources
    const whereClause: any = {
      OR: [
        { ...companyFilter, systemSource: { in: [systemSource, "ERP", "LEGACY", "APP"] } },
        { employee: companyFilter, systemSource: { in: [systemSource, "ERP", "LEGACY", "APP"] } }
      ],
      ...(employeeId ? { employeeId } : {})
    };

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            designation: true,
            employmentType: true,
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Auto-heal legacy or uncalculated attendance statuses on-the-fly without corrupting checkInTime
    for (const att of attendances) {
      if (
        att.checkInTime &&
        att.status !== "ABSENT" &&
        att.status !== "HALF_DAY" &&
        att.status !== "OFF_DAY_WORK" &&
        att.reviewStatus !== "CONSIDERED" &&
        att.reviewStatus !== "WAIVED" &&
        att.reviewStatus !== "EXCUSED"
      ) {
        const effectiveCompanyId = att.companyId || companyIdForGuard || "";
        const calc = await calculateAttendanceStatus(effectiveCompanyId, att.employeeId, att.checkInTime);

        if (
          calc.lateMinutes !== att.lateMinutes ||
          calc.status !== att.status ||
          calc.isLate !== att.isLate
        ) {
          att.status = calc.status;
          att.isLate = calc.isLate;
          att.lateMinutes = calc.lateMinutes;

          prisma.attendance.update({
            where: { id: att.id },
            data: {
              status: calc.status,
              isLate: calc.isLate,
              lateMinutes: calc.lateMinutes,
            }
          }).catch(err => console.error("Auto-heal attendance error for id:", att.id, err));
        }
      }
    }

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ATTENDANCE");
  if (moduleGuard) return moduleGuard;

  try {
    const data = await request.json();
    
    if (!data.employeeId || !data.date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // SECURITY HOTFIX: Validate employee belongs to authenticated company
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, companyId: companyIdForGuard }
    });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found or access denied' }, { status: 403 });
    }

    let status = data.status || 'PRESENT';

    // GPS Validation (Assuming checkInLocation is 'lat,lng')
    if (data.checkInLocation) {
      const [latStr, lngStr] = data.checkInLocation.split(',');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        if (!isWithinOfficeRadius(lat, lng)) {
          status = 'OUTSIDE_OFFICE';
        }
      }
    }

    const compSetting = await prisma.companySetting.findUnique({
      where: { companyId: companyIdForGuard },
      select: { timezone: true }
    });
    let timezone = compSetting?.timezone || "Asia/Dhaka";
    if (!timezone || timezone === "UTC" || timezone === "UTC / GMT") {
      timezone = "Asia/Dhaka";
    }

    const checkInDate = parseDateTimeInTimezone(data.date, data.checkIn, timezone);
    const checkOutDate = parseDateTimeInTimezone(data.date, data.checkOut, timezone);

    let finalLateMinutes = data.lateMinutes !== undefined && data.lateMinutes !== "" ? Number(data.lateMinutes) : 0;
    let finalStatus = status;
    let isLate = false;

    if (finalLateMinutes === 0 && checkInDate) {
      const calc = await calculateAttendanceStatus(companyIdForGuard, data.employeeId, checkInDate);
      finalLateMinutes = calc.lateMinutes;
      isLate = calc.isLate;
      if (!data.status || data.status === 'PRESENT') {
        finalStatus = calc.status;
      }
    } else if (finalLateMinutes > 0) {
      isLate = true;
      if (!data.status || data.status === 'PRESENT') {
        finalStatus = 'LATE';
      }
    }

    let finalEarlyLeaveMinutes = data.earlyLeaveMinutes !== undefined && data.earlyLeaveMinutes !== "" ? Number(data.earlyLeaveMinutes) : 0;
    if (finalEarlyLeaveMinutes === 0 && checkOutDate) {
      const earlyCalc = await calculateEarlyLeaveStatus(companyIdForGuard, data.employeeId, checkOutDate);
      finalEarlyLeaveMinutes = earlyCalc.earlyLeaveMinutes;
    }

    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const attendance = await prisma.attendance.create({
      data: {
        companyId: companyIdForGuard,
        employeeId: data.employeeId,
        date: new Date(data.date),
        checkInTime: checkInDate,
        checkInLocation: data.checkInLocation || null,
        checkOutTime: checkOutDate,
        checkOutLocation: data.checkOutLocation || null,
        status: finalStatus,
        isLate,
        lateMinutes: finalLateMinutes,
        earlyLeaveMinutes: finalEarlyLeaveMinutes,
        systemSource
      }
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error('Failed to create attendance:', error);
    return NextResponse.json({ error: 'Failed to create attendance' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  if (!companyIdForGuard) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Attendance record ID is required' }, { status: 400 });
    }

    // Verify record ownership
    const existing = await prisma.attendance.findFirst({
      where: {
        id,
        OR: [
          { companyId: companyIdForGuard },
          { employee: { companyId: companyIdForGuard } }
        ]
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Attendance record not found or unauthorized' }, { status: 404 });
    }

    // Clear dependent adjustments/overtimes before deleting attendance
    await prisma.$transaction(async (tx) => {
      await tx.attendanceAdjustment.deleteMany({ where: { attendanceId: id } });
      await tx.attendanceOvertime.deleteMany({ where: { attendanceId: id } });
      await tx.attendance.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete attendance:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete attendance' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  let companyIdForGuard: string | null = null;
  try {
    companyIdForGuard = await getCompanyId();
  } catch {}

  const companyFilter = await withCompany(false).catch(() => ({}));
  const effectiveCompanyId = companyIdForGuard || (companyFilter as any)?.companyId;

  try {
    const data = await request.json();
    const { id, action, lateMinutes, reason, status } = data;

    if (!id) {
      return NextResponse.json({ error: 'Attendance record ID is required' }, { status: 400 });
    }

    const existing = await prisma.attendance.findFirst({
      where: {
        id,
        ...(effectiveCompanyId ? {
          OR: [
            { companyId: effectiveCompanyId },
            { employee: { companyId: effectiveCompanyId } }
          ]
        } : {})
      },
      include: { employee: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Attendance record not found or unauthorized' }, { status: 404 });
    }

    const activeCompanyId = effectiveCompanyId || existing.companyId || existing.employee?.companyId || "";

    let updateData: any = {};

    if (action === 'CONSIDER_LATE' || action === 'WAIVE_LATE') {
      const minutes = typeof lateMinutes === 'number' ? Math.max(0, lateMinutes) : 0;
      const isLate = minutes > 0;
      const finalStatus = isLate ? 'LATE' : 'PRESENT';
      const note = reason || 'HR Late Consideration (Staff forgot to press check-in)';

      updateData = {
        lateMinutes: minutes,
        isLate,
        status: finalStatus,
        reviewStatus: 'CONSIDERED',
        punishmentAmount: 0,
        punishmentReason: note,
      };

      // Record adjustment in AttendanceAdjustment for full transparency
      try {
        await prisma.attendanceAdjustment.create({
          data: {
            attendanceId: id,
            employeeId: existing.employeeId,
            type: 'LATE_CONSIDERATION',
            reason: note,
            status: 'APPROVED',
          }
        });
      } catch (adjErr) {
        console.warn('AttendanceAdjustment creation optional:', adjErr);
      }
    } else if (action === 'REVERT_CONSIDERATION') {
      // Revert to raw calculated late arrival time based on original check-in timestamp
      if (existing.checkInTime) {
        const calc = await calculateAttendanceStatus(activeCompanyId, existing.employeeId, existing.checkInTime);
        updateData = {
          status: calc.status,
          isLate: calc.isLate,
          lateMinutes: calc.lateMinutes,
          reviewStatus: null,
          punishmentReason: null,
        };
      } else {
        updateData = {
          reviewStatus: null,
          punishmentReason: null,
        };
      }

      try {
        await prisma.attendanceAdjustment.deleteMany({
          where: { attendanceId: id, type: 'LATE_CONSIDERATION' }
        });
      } catch {}
    } else if (action === 'AUTO_CHECKOUT' || action === 'MANUAL_CHECKOUT' || action === 'HALF_DAY_OUT') {
      const compSetting = activeCompanyId ? await prisma.companySetting.findUnique({
        where: { companyId: activeCompanyId },
        select: { timezone: true, shiftEndTime: true, shiftStartTime: true }
      }) : null;
      let timezone = compSetting?.timezone || "Asia/Dhaka";
      if (!timezone || timezone === "UTC" || timezone === "UTC / GMT") {
        timezone = "Asia/Dhaka";
      }
      try { Intl.DateTimeFormat(undefined, { timeZone: timezone }); } catch { timezone = "Asia/Dhaka"; }

      const dateToFormat = existing.date || existing.checkInTime || new Date();
      const dateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(new Date(dateToFormat));

      let shiftEndStr = "18:00";
      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

      try {
        const roster = await prisma.attendanceRoster.findFirst({
          where: {
            employeeId: existing.employeeId,
            date: { gte: startOfDay, lte: endOfDay },
            status: { not: "CANCELLED" }
          },
          include: { workShift: true }
        });
        if (roster?.endTime) shiftEndStr = roster.endTime;
        else if (roster?.workShift?.endTime) shiftEndStr = roster.workShift.endTime;
      } catch {}

      if (shiftEndStr === "18:00") {
        try {
          const emp = await prisma.employee.findUnique({
            where: { id: existing.employeeId },
            include: { workShift: true }
          });
          if (emp?.workShift?.endTime) {
            shiftEndStr = emp.workShift.endTime;
          }
        } catch {}
      }

      if (shiftEndStr === "18:00" && activeCompanyId) {
        try {
          const attConfig = await prisma.attendanceConfig.findFirst({
            where: { companyId: activeCompanyId }
          });
          if (attConfig?.shiftEnd) {
            shiftEndStr = attConfig.shiftEnd;
          } else if (compSetting?.shiftEndTime) {
            shiftEndStr = compSetting.shiftEndTime;
          }
        } catch {}
      }

      const isHalfDay = action === 'HALF_DAY_OUT' || data.checkoutType === 'HALF_DAY';
      const targetTimeStr = data.checkOutTime || data.checkOut || (isHalfDay ? undefined : shiftEndStr);
      let checkOutDate: Date | null = null;
      if (targetTimeStr) {
        checkOutDate = parseDateTimeInTimezone(dateStr, targetTimeStr, timezone);
      }
      if (!checkOutDate) {
        checkOutDate = new Date();
      }

      let totalWorkingMinutes = 0;
      if (existing.checkInTime) {
        totalWorkingMinutes = Math.max(0, Math.floor((checkOutDate.getTime() - existing.checkInTime.getTime()) / 60000));
      }

      if (!existing.checkInTime) {
        const shiftStartStr = compSetting?.shiftStartTime || "09:30";
        const checkInDate = parseDateTimeInTimezone(dateStr, shiftStartStr, timezone) || checkOutDate;
        updateData.checkInTime = checkInDate;
        totalWorkingMinutes = Math.max(0, Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / 60000));
      }

      if (isHalfDay) {
        const permitReason = reason || data.reason || 'Emergency departure permitted by HR (Half Day)';
        updateData = {
          ...updateData,
          checkOutTime: checkOutDate,
          totalWorkingMinutes,
          status: 'HALF_DAY',
          earlyLeaveMinutes: 0,
          reviewStatus: 'PERMITTED_HALF_DAY',
          punishmentAmount: 0,
          punishmentReason: permitReason,
        };

        // Create adjustment record for full transparency
        try {
          await prisma.attendanceAdjustment.create({
            data: {
              attendanceId: id,
              employeeId: existing.employeeId,
              type: 'HALF_DAY_PERMIT',
              reason: permitReason,
              status: 'APPROVED',
            }
          });
        } catch (adjErr) {
          console.warn('Optional adjustment creation for half day permit:', adjErr);
        }
      } else {
        const earlyCalc = await calculateEarlyLeaveStatus(activeCompanyId, existing.employeeId, checkOutDate);
        updateData = {
          ...updateData,
          checkOutTime: checkOutDate,
          totalWorkingMinutes,
          earlyLeaveMinutes: earlyCalc.earlyLeaveMinutes,
        };

        if (existing.status === 'ABSENT' || !existing.checkInTime) {
          updateData.status = 'PRESENT';
          updateData.punishmentAmount = 0;
          updateData.punishmentReason = null;
        }
      }

      if (!existing.companyId && activeCompanyId) {
        updateData.companyId = activeCompanyId;
      }
    } else {
      if (lateMinutes !== undefined) {
        updateData.lateMinutes = Number(lateMinutes);
        updateData.isLate = Number(lateMinutes) > 0;
      }
      if (status) updateData.status = status;
      if (reason) updateData.punishmentReason = reason;
      if (data.reviewStatus !== undefined) updateData.reviewStatus = data.reviewStatus;
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, attendance: updated });
  } catch (error: any) {
    console.error('Failed to update attendance consideration:', error);
    return NextResponse.json({ error: error.message || 'Failed to update attendance' }, { status: 500 });
  }
}


