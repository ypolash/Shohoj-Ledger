import { prisma } from "@/lib/prisma";

export interface AttendanceCalculationResult {
  isLate: boolean;
  lateMinutes: number;
  status: string;
  normalizedCheckInTime?: Date;
}

/**
 * Returns current timestamp and date-only (midnight UTC representation of local day)
 * in the designated timezone (defaults to Asia/Dhaka).
 */
export function getNowInTimezone(timezone: string = "Asia/Dhaka") {
  const now = new Date();
  let targetTz = timezone;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: targetTz });
  } catch {
    targetTz = "Asia/Dhaka";
  }
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: targetTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const dateStr = fmt.format(now); // "YYYY-MM-DD"
  const todayDateOnly = new Date(`${dateStr}T00:00:00.000Z`);
  return { now, todayDateOnly, dateStr };
}

/**
 * Parses time strings in various formats (e.g. "09:30", "9:30 AM", "13:45", "09:30:00")
 * into total minutes from midnight.
 */
export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return 0;
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const meridian = match[4]?.toUpperCase();
  if (meridian === "PM" && hour < 12) hour += 12;
  if (meridian === "AM" && hour === 12) hour = 0;
  return hour * 60 + min;
}

/**
 * Parses a wall-clock date string (e.g. "2026-09-10") and time string (e.g. "11:34" or "11:34 AM")
 * according to a designated IANA timezone (default "Asia/Dhaka"), converting it into an accurate UTC Date object.
 * This ensures that when running on UTC servers (e.g. Docker/Coolify), inputs from local users are not warped.
 */
export function parseDateTimeInTimezone(
  dateStr: string,
  timeOrDateStr?: string | null,
  timezone: string = "Asia/Dhaka"
): Date | null {
  if (!timeOrDateStr) return null;
  const trimmed = timeOrDateStr.trim();

  // If already an ISO string with explicit timezone Z or offset, e.g. "2026-09-10T05:34:00.000Z"
  if (/T.*\d{2}:\d{2}/.test(trimmed) && (trimmed.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(trimmed))) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  // Parse time components
  let hour = 0;
  let minute = 0;
  let second = 0;

  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (timeMatch) {
    hour = parseInt(timeMatch[1], 10);
    minute = parseInt(timeMatch[2], 10);
    second = parseInt(timeMatch[3] || "0", 10);
    const meridian = timeMatch[4]?.toUpperCase();
    if (meridian === "PM" && hour < 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;
  } else {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
    return null;
  }

  const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.slice(0, 10);
  const [yearStr, monthStr, dayStr] = datePart.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  // Resolve target timezone, validating against Intl
  let targetTz = timezone;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: targetTz });
  } catch {
    targetTz = "Asia/Dhaka";
  }

  // Construct UTC approximate date
  const utcApprox = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  // Determine the timezone's offset at this instant
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: targetTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = fmt.formatToParts(utcApprox);
  const pMap: Record<string, string> = {};
  for (const p of parts) pMap[p.type] = p.value;

  const tzYear = parseInt(pMap.year, 10);
  const tzMonth = parseInt(pMap.month, 10);
  const tzDay = parseInt(pMap.day, 10);
  let tzHour = parseInt(pMap.hour, 10);
  if (tzHour === 24) tzHour = 0;
  const tzMin = parseInt(pMap.minute, 10);
  const tzSec = parseInt(pMap.second, 10);

  const asUtc = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMin, tzSec);
  const offsetMs = asUtc - utcApprox.getTime();

  return new Date(utcApprox.getTime() - offsetMs);
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
  // 1. Resolve Employee with WorkShift & Company Relations
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      workShift: true,
      company: {
        include: {
          settings: true,
          attendanceConfigs: true,
        }
      }
    }
  });

  const effectiveCompanyId = companyId || employee?.companyId || "";

  // 2. Resolve Company Settings & Attendance Config
  let compSetting: any = employee?.company?.settings || null;
  if (!compSetting && effectiveCompanyId) {
    compSetting = await prisma.companySetting.findUnique({
      where: { companyId: effectiveCompanyId },
    });
  }

  let config: any = employee?.company?.attendanceConfigs?.[0] || null;
  if (!config && effectiveCompanyId) {
    config = await prisma.attendanceConfig.findFirst({
      where: { companyId: effectiveCompanyId },
    });
  }

  // 3. Resolve Timezone (Default Asia/Dhaka; if set to UTC or empty, treat as Asia/Dhaka)
  let timezone = compSetting?.timezone || "Asia/Dhaka";
  if (!timezone || timezone === "UTC" || timezone === "UTC / GMT") {
    timezone = "Asia/Dhaka";
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    timezone = "Asia/Dhaka";
  }

  // 4. Extract check-in components in the company's local timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
  });

  const parts = formatter.formatToParts(checkInTime);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  let checkInHour = parseInt(partMap.hour, 10) || 0;
  if (checkInHour === 24) checkInHour = 0;
  let checkInMin = parseInt(partMap.minute, 10) || 0;
  const weekday = partMap.weekday; // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"

  // 5. Resolve Office Shift Start & Grace Period (Roster override > Permanent Shift > Company Default)
  let shiftStartStr = "09:30";
  let gracePeriod = 0;
  let isFridayOff = true;
  let isNightShift = false;

  if (config?.shiftStart) {
    shiftStartStr = config.shiftStart;
  } else if (compSetting?.shiftStartTime) {
    shiftStartStr = compSetting.shiftStartTime;
  }

  if (config?.gracePeriod !== undefined && config?.gracePeriod !== null) {
    gracePeriod = config.gracePeriod;
  } else if (compSetting?.gracePeriodMinutes !== undefined && compSetting?.gracePeriodMinutes !== null) {
    gracePeriod = compSetting.gracePeriodMinutes;
  }

  if (config?.fridayOff !== undefined && config?.fridayOff !== null) {
    isFridayOff = config.fridayOff;
  }

  // Check specific day AttendanceRoster duty override first
  const localDateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const startOfDay = new Date(`${localDateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${localDateStr}T23:59:59.999Z`);

  let dayRoster: any = null;
  try {
    dayRoster = await prisma.attendanceRoster.findFirst({
      where: {
        employeeId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: "CANCELLED" }
      },
      include: {
        workShift: true
      }
    });
  } catch (rErr) {
    // Graceful fallback if table query fails
  }

  if (dayRoster) {
    if (dayRoster.startTime) {
      shiftStartStr = dayRoster.startTime;
    } else if (dayRoster.workShift?.startTime) {
      shiftStartStr = dayRoster.workShift.startTime;
    }

    if (dayRoster.gracePeriod !== null && dayRoster.gracePeriod !== undefined) {
      gracePeriod = dayRoster.gracePeriod;
    } else if (dayRoster.workShift?.gracePeriod !== null && dayRoster.workShift?.gracePeriod !== undefined) {
      gracePeriod = dayRoster.workShift.gracePeriod;
    }

    if (dayRoster.workShift?.nightShift) {
      isNightShift = true;
    }
  } else if (employee?.workShift) {
    // Fallback to employee assigned permanent workShift
    shiftStartStr = employee.workShift.startTime || shiftStartStr;
    gracePeriod = employee.workShift.gracePeriod ?? gracePeriod;
    isNightShift = !!employee.workShift.nightShift;
  }

  // 6. Parse Shift Start Minutes
  const shiftStartMinutes = parseTimeToMinutes(shiftStartStr);
  const startHour = Math.floor(shiftStartMinutes / 60);

  let checkInMinutes = checkInHour * 60 + checkInMin;

  // Handle night shifts spanning past midnight (e.g. starting at 22:00 and checkIn is 00:30)
  if (isNightShift && startHour >= 18 && checkInHour < 12) {
    checkInMinutes += 24 * 60;
  }

  const lateThreshold = shiftStartMinutes + gracePeriod;

  // Check Weekly Holiday
  const weeklyHolidays = Array.isArray(compSetting?.weeklyHolidays)
    ? (compSetting.weeklyHolidays as string[]).map(d => d.toLowerCase().slice(0, 3))
    : ["fri"];
  const dayShort = weekday.toLowerCase().slice(0, 3);
  const isOffDay = (isFridayOff && dayShort === "fri") || weeklyHolidays.includes(dayShort);

  let status = "PRESENT";
  let lateMinutes = 0;
  let isLate = false;

  if (isOffDay) {
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

  const normalizedCheckInTime: Date | undefined = undefined;

  return { isLate, lateMinutes, status, normalizedCheckInTime };
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
): Promise<{ earlyLeaveMinutes: number; isEarlyLeave: boolean; normalizedCheckOutTime?: Date }> {
  // 1. Resolve Employee with WorkShift & Company Relations
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      workShift: true,
      company: {
        include: {
          settings: true,
          attendanceConfigs: true,
        }
      }
    }
  });

  const effectiveCompanyId = companyId || employee?.companyId || "";

  // 2. Resolve Company Settings & Attendance Config
  let compSetting: any = employee?.company?.settings || null;
  if (!compSetting && effectiveCompanyId) {
    compSetting = await prisma.companySetting.findUnique({
      where: { companyId: effectiveCompanyId },
    });
  }

  let config: any = employee?.company?.attendanceConfigs?.[0] || null;
  if (!config && effectiveCompanyId) {
    config = await prisma.attendanceConfig.findFirst({
      where: { companyId: effectiveCompanyId },
    });
  }

  // 3. Resolve Timezone
  let timezone = compSetting?.timezone || "Asia/Dhaka";
  if (!timezone || timezone === "UTC" || timezone === "UTC / GMT") {
    timezone = "Asia/Dhaka";
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    timezone = "Asia/Dhaka";
  }

  // 4. Extract check-out components in local timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "numeric",
  });

  const parts = formatter.formatToParts(checkOutTime);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  let shiftEndStr = "18:00";
  let isNightShift = false;

  if (config?.shiftEnd) {
    shiftEndStr = config.shiftEnd;
  } else if (compSetting?.shiftEndTime) {
    shiftEndStr = compSetting.shiftEndTime;
  }

  // Check specific day AttendanceRoster duty override first
  const localDateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const startOfDay = new Date(`${localDateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${localDateStr}T23:59:59.999Z`);

  let dayRoster: any = null;
  try {
    dayRoster = await prisma.attendanceRoster.findFirst({
      where: {
        employeeId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: "CANCELLED" }
      },
      include: {
        workShift: true
      }
    });
  } catch (rErr) {
    // Graceful fallback
  }

  if (dayRoster) {
    if (dayRoster.endTime) {
      shiftEndStr = dayRoster.endTime;
    } else if (dayRoster.workShift?.endTime) {
      shiftEndStr = dayRoster.workShift.endTime;
    }

    if (dayRoster.workShift?.nightShift) {
      isNightShift = true;
    }
  } else if (employee?.workShift) {
    shiftEndStr = employee.workShift.endTime || shiftEndStr;
    isNightShift = !!employee.workShift.nightShift;
  }

  let checkOutHour = parseInt(partMap.hour, 10) || 0;
  if (checkOutHour === 24) checkOutHour = 0;
  let checkOutMin = parseInt(partMap.minute, 10) || 0;

  // 5. Parse Shift End Minutes
  let shiftEndMinutes = parseTimeToMinutes(shiftEndStr);
  const endHour = Math.floor(shiftEndMinutes / 60);

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

  const normalizedCheckOutTime: Date | undefined = undefined;

  return {
    earlyLeaveMinutes,
    isEarlyLeave: earlyLeaveMinutes > 0,
    normalizedCheckOutTime
  };
}

/**
 * Recalculates late status and late/early leave minutes for existing attendance records
 * that may have been recorded with 0 minutes due to UTC server offset or legacy entry formats.
 * Handles company ID linking via employee even when attendance.companyId is null.
 */
export async function recalculateRecentAttendance(companyId?: string) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const where: any = {
    checkInTime: { not: null },
    date: { gte: ninetyDaysAgo }
  };
  if (companyId) {
    where.OR = [
      { companyId },
      { employee: { companyId } }
    ];
  }

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
      employee: {
        select: {
          companyId: true,
        }
      }
    }
  });

  let updatedCount = 0;
  for (const rec of records) {
    if (!rec.checkInTime) continue;

    // Skip records explicitly marked ABSENT, HALF_DAY, or OFF_DAY_WORK
    if (rec.status === "ABSENT" || rec.status === "HALF_DAY" || rec.status === "OFF_DAY_WORK") {
      continue;
    }

    const effectiveCompanyId = rec.companyId || rec.employee?.companyId || companyId || "";

    const calc = await calculateAttendanceStatus(effectiveCompanyId, rec.employeeId, rec.checkInTime);
    let earlyLeaveMinutes = rec.earlyLeaveMinutes || 0;
    let normalizedCheckOut: Date | undefined = undefined;
    if (rec.checkOutTime) {
      const earlyCalc = await calculateEarlyLeaveStatus(effectiveCompanyId, rec.employeeId, rec.checkOutTime);
      earlyLeaveMinutes = earlyCalc.earlyLeaveMinutes;
      normalizedCheckOut = earlyCalc.normalizedCheckOutTime;
    }

    const checkInChanged = !!calc.normalizedCheckInTime && calc.normalizedCheckInTime.getTime() !== rec.checkInTime.getTime();
    const checkOutChanged = !!normalizedCheckOut && !!rec.checkOutTime && normalizedCheckOut.getTime() !== rec.checkOutTime.getTime();

    if (
      calc.lateMinutes !== rec.lateMinutes ||
      calc.status !== rec.status ||
      calc.isLate !== rec.isLate ||
      earlyLeaveMinutes !== rec.earlyLeaveMinutes ||
      checkInChanged ||
      checkOutChanged ||
      (!rec.companyId && effectiveCompanyId)
    ) {
      await prisma.attendance.update({
        where: { id: rec.id },
        data: {
          status: calc.status,
          isLate: calc.isLate,
          lateMinutes: calc.lateMinutes,
          earlyLeaveMinutes,
          ...(checkInChanged ? { checkInTime: calc.normalizedCheckInTime } : {}),
          ...(checkOutChanged ? { checkOutTime: normalizedCheckOut } : {}),
          ...(rec.companyId ? {} : (effectiveCompanyId ? { companyId: effectiveCompanyId } : {})),
        }
      });
      updatedCount++;
    }
  }

  return { totalChecked: records.length, updatedCount };
}

/**
 * Scans all employees scheduled for duty on a specific date.
 * If an employee does not check in during their scheduled duty time and has no approved leave,
 * marks them as ABSENT with their designated penalty/fine and reason.
 */
export async function evaluateDailyAbsenceAndPenalties(companyId: string, targetDateStr?: string) {
  // 1. Resolve Company Settings & Timezone
  const compSetting = await prisma.companySetting.findUnique({
    where: { companyId },
  });

  let timezone = compSetting?.timezone || "Asia/Dhaka";
  if (!timezone || timezone === "UTC" || timezone === "UTC / GMT") {
    timezone = "Asia/Dhaka";
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    timezone = "Asia/Dhaka";
  }

  // 2. Resolve Date in Local Timezone
  const now = new Date();
  let dateString = targetDateStr;
  if (!dateString) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    dateString = formatter.format(now); // e.g. "2026-10-06"
  }

  const startOfDay = new Date(`${dateString}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateString}T23:59:59.999Z`);

  // 3. Resolve Weekly Holidays & Company Config
  const config = await prisma.attendanceConfig.findFirst({
    where: { companyId },
  });

  const weeklyHolidays = Array.isArray(compSetting?.weeklyHolidays)
    ? (compSetting.weeklyHolidays as string[]).map(d => d.toLowerCase().slice(0, 3))
    : ["fri"];
  
  const dayOfWeekStr = new Date(startOfDay).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toLowerCase().slice(0, 3);
  const isWeeklyHoliday = (config?.fridayOff !== false && dayOfWeekStr === "fri") || weeklyHolidays.includes(dayOfWeekStr);

  // 4. Fetch Absent Punishment Rule
  const absentPunishmentRule = await prisma.punishmentSetting.findFirst({
    where: {
      companyId,
      type: "ABSENT",
      active: true,
    },
    orderBy: { amount: "desc" }
  });

  // 5. Fetch Active Employees
  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      status: "ACTIVE"
    },
    include: {
      workShift: true
    }
  });

  // 6. Fetch Existing Attendance Records for this date
  const existingAttendances = await prisma.attendance.findMany({
    where: {
      companyId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      }
    }
  });
  const attendanceEmpMap = new Map(existingAttendances.map(a => [a.employeeId, a]));

  // 7. Fetch Approved Leaves covering this date
  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: {
      companyId,
      status: "APPROVED",
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay },
    }
  });
  const leaveEmpSet = new Set(approvedLeaves.map(l => l.employeeId));

  // 8. Fetch Duty Roster overrides for this date
  const dutyRosters = await prisma.attendanceRoster.findMany({
    where: {
      companyId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: { not: "CANCELLED" }
    },
    include: {
      workShift: true
    }
  });
  const rosterEmpMap = new Map(dutyRosters.map(r => [r.employeeId, r]));

  let absentCount = 0;
  let totalPenalties = 0;
  const absentEmployees: Array<{ employeeId: string; name: string; penalty: number; dutyTime: string }> = [];

  for (const emp of employees) {
    const existing = attendanceEmpMap.get(emp.id);

    // If already checked in, skip
    if (existing && existing.checkInTime && existing.status !== "ABSENT") {
      continue;
    }

    // If on approved leave, record as LEAVE without penalty
    if (leaveEmpSet.has(emp.id)) {
      if (!existing) {
        await prisma.attendance.create({
          data: {
            companyId,
            employeeId: emp.id,
            date: startOfDay,
            status: "LEAVE",
            isLate: false,
            lateMinutes: 0,
            punishmentAmount: 0,
            punishmentReason: "Approved Leave of Absence",
            systemSource: "ERP"
          }
        });
      }
      continue;
    }

    // If it's a weekly holiday and employee was not specifically scheduled on the duty roster, skip
    const roster = rosterEmpMap.get(emp.id);
    if (isWeeklyHoliday && !roster) {
      continue;
    }

    // Resolve duty start and end time
    const dutyStart = roster?.startTime || roster?.workShift?.startTime || emp.workShift?.startTime || config?.shiftStart || compSetting?.shiftStartTime || "09:30";
    const dutyEnd = roster?.endTime || roster?.workShift?.endTime || emp.workShift?.endTime || config?.shiftEnd || compSetting?.shiftEndTime || "18:00";
    const dutyLabel = `${dutyStart} - ${dutyEnd}`;

    // Calculate penalty amount
    let penaltyAmount = 0;
    if (absentPunishmentRule && Number(absentPunishmentRule.amount) > 0) {
      penaltyAmount = Number(absentPunishmentRule.amount);
    } else if (emp.basicSalary && Number(emp.basicSalary) > 0) {
      // 1 day salary deduction fallback
      penaltyAmount = Math.round(Number(emp.basicSalary) / 22);
    }

    const reason = `Unexcused Absence on ${dateString} [Duty Time: ${dutyLabel}]`;

    // Create or update attendance record as ABSENT with penalty
    await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: emp.id,
          date: startOfDay,
        }
      },
      create: {
        companyId,
        employeeId: emp.id,
        date: startOfDay,
        status: "ABSENT",
        isLate: false,
        lateMinutes: 0,
        punishmentAmount: penaltyAmount,
        punishmentReason: reason,
        systemSource: "ERP"
      },
      update: {
        status: "ABSENT",
        isLate: false,
        lateMinutes: 0,
        punishmentAmount: penaltyAmount,
        punishmentReason: reason,
      }
    });

    absentCount++;
    totalPenalties += penaltyAmount;
    absentEmployees.push({
      employeeId: emp.employeeId,
      name: `${emp.firstName} ${emp.lastName}`,
      penalty: penaltyAmount,
      dutyTime: dutyLabel
    });
  }

  return {
    success: true,
    date: dateString,
    totalEmployees: employees.length,
    absentCount,
    totalPenalties,
    absentEmployees
  };
}

