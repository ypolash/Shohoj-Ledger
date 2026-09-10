import { prisma } from "@/lib/prisma";

export interface AttendanceCalculationResult {
  isLate: boolean;
  lateMinutes: number;
  status: string;
}

/**
 * Calculates whether a check-in is late, the number of late minutes, and the appropriate status.
 * Evaluates everything in the company's designated timezone (defaults to Asia/Dhaka)
 * to ensure accuracy across UTC server environments (e.g. Docker/Coolify).
 */
export async function calculateAttendanceStatus(
  companyId: string,
  employeeId: string,
  checkInTime: Date
): Promise<AttendanceCalculationResult> {
  // 1. Resolve Company Timezone
  let timezone = "Asia/Dhaka";
  if (companyId) {
    const compSetting = await prisma.companySetting.findUnique({
      where: { companyId },
      select: { timezone: true }
    });
    if (compSetting?.timezone) {
      timezone = compSetting.timezone;
    }
  }

  // 2. Resolve Employee & Work Shift
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { workShift: true }
  });

  let shiftStartStr = "09:00";
  let gracePeriod = 0;
  let isFridayOff = true;
  let isNightShift = false;

  const config = await prisma.attendanceConfig.findFirst({
    where: companyId ? { companyId } : undefined
  });

  if (config) {
    shiftStartStr = config.shiftStart || "09:00";
    gracePeriod = config.gracePeriod ?? 0;
    isFridayOff = config.fridayOff ?? true;
  }

  if (employee?.workShift) {
    shiftStartStr = employee.workShift.startTime || shiftStartStr;
    gracePeriod = employee.workShift.gracePeriod ?? gracePeriod;
    isNightShift = !!employee.workShift.nightShift;
  }

  // 3. Extract check-in components in the company's local timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    hour12: false,
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
  });

  const parts = formatter.formatToParts(checkInTime);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const checkInHour = parseInt(partMap.hour, 10) || 0;
  const checkInMin = parseInt(partMap.minute, 10) || 0;
  const weekday = partMap.weekday; // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"

  // 4. Parse Shift Start
  const [sHourRaw, sMinRaw] = shiftStartStr.split(':');
  const startHour = parseInt(sHourRaw, 10) || 0;
  const startMin = parseInt(sMinRaw, 10) || 0;

  const shiftStartMinutes = startHour * 60 + startMin;
  let checkInMinutes = checkInHour * 60 + checkInMin;

  // Handle night shifts spanning past midnight (e.g. starting at 22:00 and checkIn is 00:30)
  if (isNightShift && startHour >= 18 && checkInHour < 12) {
    checkInMinutes += 24 * 60;
  }

  const lateThreshold = shiftStartMinutes + gracePeriod;
  const isFriday = weekday === "Fri";

  let status = "PRESENT";
  let lateMinutes = 0;
  let isLate = false;

  if (isFriday && isFridayOff) {
    status = "OFF_DAY_WORK";
  } else if (checkInMinutes > lateThreshold) {
    status = "LATE";
    isLate = true;
    lateMinutes = checkInMinutes - shiftStartMinutes;
  } else {
    status = "PRESENT";
    lateMinutes = 0;
    isLate = false;
  }

  return { isLate, lateMinutes, status };
}

/**
 * Calculates whether a check-out is before the designated shift end,
 * and the number of early leave minutes.
 * Evaluates in the company's designated timezone (default Asia/Dhaka).
 */
export async function calculateEarlyLeaveStatus(
  companyId: string,
  employeeId: string,
  checkOutTime: Date
): Promise<{ earlyLeaveMinutes: number; isEarlyLeave: boolean }> {
  // 1. Resolve Company Timezone
  let timezone = "Asia/Dhaka";
  if (companyId) {
    const compSetting = await prisma.companySetting.findUnique({
      where: { companyId },
      select: { timezone: true }
    });
    if (compSetting?.timezone) {
      timezone = compSetting.timezone;
    }
  }

  // 2. Resolve Employee & Work Shift
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { workShift: true }
  });

  let shiftEndStr = "18:00";
  let isNightShift = false;

  const config = await prisma.attendanceConfig.findFirst({
    where: companyId ? { companyId } : undefined
  });

  if (config) {
    shiftEndStr = config.shiftEnd || "18:00";
  }

  if (employee?.workShift) {
    shiftEndStr = employee.workShift.endTime || shiftEndStr;
    isNightShift = !!employee.workShift.nightShift;
  }

  // 3. Extract check-out components in local timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    hour12: false,
    hour: "numeric",
    minute: "numeric",
  });

  const parts = formatter.formatToParts(checkOutTime);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const checkOutHour = parseInt(partMap.hour, 10) || 0;
  const checkOutMin = parseInt(partMap.minute, 10) || 0;

  // 4. Parse Shift End
  const [eHourRaw, eMinRaw] = shiftEndStr.split(':');
  const endHour = parseInt(eHourRaw, 10) || 0;
  const endMin = parseInt(eMinRaw, 10) || 0;

  let shiftEndMinutes = endHour * 60 + endMin;
  let checkOutMinutes = checkOutHour * 60 + checkOutMin;

  // Handle night shift rollover
  if (isNightShift) {
    if (endHour < 12 && checkOutHour >= 12) {
      shiftEndMinutes += 24 * 60;
    } else if (endHour < 12 && checkOutHour < 12) {
      shiftEndMinutes += 24 * 60;
      checkOutMinutes += 24 * 60;
    }
  }

  let earlyLeaveMinutes = 0;
  if (checkOutMinutes < shiftEndMinutes) {
    earlyLeaveMinutes = shiftEndMinutes - checkOutMinutes;
  }

  return {
    earlyLeaveMinutes,
    isEarlyLeave: earlyLeaveMinutes > 0
  };
}

/**
 * Recalculates late status and late/early leave minutes for existing attendance records
 * that may have been recorded with 0 minutes due to UTC server offset.
 */
export async function recalculateRecentAttendance(companyId?: string) {
  const where: any = {
    checkInTime: { not: null }
  };
  if (companyId) where.companyId = companyId;

  // Scan last 60 days
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  where.date = { gte: sixtyDaysAgo };

  const records = await prisma.attendance.findMany({
    where,
    select: {
      id: true,
      companyId: true,
      employeeId: true,
      checkInTime: true,
      checkOutTime: true,
      status: true,
      lateMinutes: true,
      earlyLeaveMinutes: true,
      isLate: true,
    }
  });

  let updatedCount = 0;
  for (const rec of records) {
    if (!rec.checkInTime) continue;

    // Skip records explicitly marked ABSENT, HALF_DAY, or OFF_DAY_WORK
    if (rec.status === "ABSENT" || rec.status === "HALF_DAY" || rec.status === "OFF_DAY_WORK") {
      continue;
    }

    const calc = await calculateAttendanceStatus(rec.companyId || "", rec.employeeId, rec.checkInTime);
    let earlyLeaveMinutes = rec.earlyLeaveMinutes || 0;
    if (rec.checkOutTime) {
      const earlyCalc = await calculateEarlyLeaveStatus(rec.companyId || "", rec.employeeId, rec.checkOutTime);
      earlyLeaveMinutes = earlyCalc.earlyLeaveMinutes;
    }

    if (
      calc.lateMinutes !== rec.lateMinutes ||
      calc.status !== rec.status ||
      calc.isLate !== rec.isLate ||
      earlyLeaveMinutes !== rec.earlyLeaveMinutes
    ) {
      await prisma.attendance.update({
        where: { id: rec.id },
        data: {
          status: calc.status,
          isLate: calc.isLate,
          lateMinutes: calc.lateMinutes,
          earlyLeaveMinutes,
        }
      });
      updatedCount++;
    }
  }

  return { totalChecked: records.length, updatedCount };
}
