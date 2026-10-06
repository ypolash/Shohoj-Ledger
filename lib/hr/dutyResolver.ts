import { prisma } from "@/lib/prisma";
import { getNowInTimezone } from "@/lib/attendance";

export interface EffectiveDutySchedule {
  id?: string | null;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriod: number;
  breakTime: number;
  nightShift: boolean;
  isCustom: boolean;
  isRoster: boolean;
  rosterId?: string | null;
  rosterDate?: string | null;
  rosterNote?: string | null;
  dutyTypeLabel: string;
  dutyHoursFormatted: string;
  status?: string | null;
}

/**
 * Resolves the effective duty schedule for an employee on a given date.
 * Precedence:
 *  1. AttendanceRoster override on targetDate
 *  2. Employee permanent WorkShift (Custom Duty)
 *  3. Company default shift (AttendanceConfig / CompanySetting)
 */
export async function getEffectiveDutySchedule(
  employeeIdOrCode: string,
  companyId?: string | null,
  targetDate?: Date | string | null
): Promise<{ employee: any; dutySchedule: EffectiveDutySchedule }> {
  const employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { id: employeeIdOrCode },
        { employeeId: employeeIdOrCode },
      ],
      ...(companyId ? { companyId } : {}),
    },
    include: {
      workShift: true,
      company: {
        include: {
          settings: true,
          attendanceConfigs: true,
        },
      },
    },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const effectiveCompanyId = companyId || employee.companyId;

  // Resolve target date in company timezone (default Asia/Dhaka)
  const timezone = employee.company?.settings?.timezone || "Asia/Dhaka";
  let targetDateObj: Date;
  let dateStr: string;

  if (targetDate) {
    if (typeof targetDate === "string") {
      dateStr = targetDate.includes("T") ? targetDate.split("T")[0] : targetDate;
      targetDateObj = new Date(`${dateStr}T00:00:00.000Z`);
    } else {
      dateStr = targetDate.toISOString().split("T")[0];
      targetDateObj = new Date(`${dateStr}T00:00:00.000Z`);
    }
  } else {
    const tzInfo = getNowInTimezone(timezone);
    dateStr = tzInfo.dateStr;
    targetDateObj = tzInfo.todayDateOnly;
  }

  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  // 1. Check AttendanceRoster for target date
  let dayRoster = null;
  try {
    dayRoster = await prisma.attendanceRoster.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: "CANCELLED" },
      },
      include: {
        workShift: true,
      },
    });
  } catch (err) {
    console.error("Error querying attendance roster:", err);
  }

  if (dayRoster) {
    const startTime = dayRoster.startTime || dayRoster.workShift?.startTime || "09:00";
    const endTime = dayRoster.endTime || dayRoster.workShift?.endTime || "18:00";
    const gracePeriod = dayRoster.gracePeriod ?? dayRoster.workShift?.gracePeriod ?? 15;
    const breakTime = dayRoster.workShift?.breakTime ?? 60;
    const nightShift = dayRoster.workShift?.nightShift ?? false;
    const shiftName = dayRoster.workShift?.name || "Assigned Duty Roster";

    return {
      employee,
      dutySchedule: {
        id: dayRoster.id,
        name: shiftName,
        startTime,
        endTime,
        gracePeriod,
        breakTime,
        nightShift,
        isCustom: true,
        isRoster: true,
        rosterId: dayRoster.id,
        rosterDate: dateStr,
        rosterNote: dayRoster.note || null,
        status: dayRoster.status,
        dutyTypeLabel: `📅 Assigned Duty Roster (${shiftName})`,
        dutyHoursFormatted: `${startTime} - ${endTime}`,
      },
    };
  }

  // 2. Check Employee Custom Duty permanent work shift
  if (employee.workShift) {
    const ws = employee.workShift;
    return {
      employee,
      dutySchedule: {
        id: ws.id,
        name: ws.name,
        startTime: ws.startTime,
        endTime: ws.endTime,
        gracePeriod: ws.gracePeriod ?? 15,
        breakTime: ws.breakTime ?? 60,
        nightShift: ws.nightShift ?? false,
        isCustom: true,
        isRoster: false,
        rosterId: null,
        rosterDate: null,
        rosterNote: null,
        status: ws.isActive ? "ACTIVE" : "INACTIVE",
        dutyTypeLabel: `⚡ Custom Duty Schedule (${ws.name})`,
        dutyHoursFormatted: `${ws.startTime} - ${ws.endTime}`,
      },
    };
  }

  // 3. Fallback to Company Default Shift
  const config = employee.company?.attendanceConfigs?.[0];
  const setting = employee.company?.settings;
  const startTime = config?.shiftStart || setting?.shiftStartTime || "09:00";
  const endTime = config?.shiftEnd || setting?.shiftEndTime || "18:00";
  const gracePeriod = config?.gracePeriod ?? setting?.gracePeriodMinutes ?? 15;

  return {
    employee,
    dutySchedule: {
      id: null,
      name: "Regular Shift",
      startTime,
      endTime,
      gracePeriod,
      breakTime: 60,
      nightShift: false,
      isCustom: false,
      isRoster: false,
      rosterId: null,
      rosterDate: null,
      rosterNote: null,
      status: "ACTIVE",
      dutyTypeLabel: "Standard Company Shift",
      dutyHoursFormatted: `${startTime} - ${endTime}`,
    },
  };
}
