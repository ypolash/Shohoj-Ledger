import { prisma } from "@/lib/prisma";

export async function calculateAttendanceStatus(
  companyId: string,
  employeeId: string,
  checkInTime: Date
): Promise<{ isLate: boolean; lateMinutes: number; status: string }> {
  // Get employee's work shift
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { workShift: true }
  });

  let shiftStartStr = "09:00";
  let gracePeriod = 0;
  let isFridayOff = false;

  const config = await prisma.attendanceConfig.findFirst({
    where: { companyId }
  });

  if (config) {
    if (!employee?.workShift) {
      shiftStartStr = config.shiftStart || "09:00";
    }
    gracePeriod = config.gracePeriod || 0;
    isFridayOff = config.fridayOff ?? true;
  }

  if (employee?.workShift) {
    shiftStartStr = employee.workShift.startTime;
    gracePeriod = employee.workShift.gracePeriod;
  }

  // Calculate shift start date based on the check-in time's date (local timezone assumption based on how the server runs)
  // To avoid UTC issues, we extract the year, month, date from checkInTime and construct a new Date
  const shiftStartDate = new Date(checkInTime);
  const parts = shiftStartStr.split(':');
  const startHour = parseInt(parts[0], 10);
  const startMin = parseInt(parts[1], 10);
  
  shiftStartDate.setHours(startHour, startMin, 0, 0);

  const lateAfter = new Date(shiftStartDate);
  lateAfter.setMinutes(lateAfter.getMinutes() + gracePeriod);

  // Consider Dhaka timezone for friday check. 
  // Javascript getDay() uses local timezone of the Node server. We'll stick to it assuming the server is in the same timezone or checkInTime is already correct.
  const isFriday = checkInTime.getDay() === 5;

  let status = "PRESENT";
  let lateMinutes = 0;
  let isLate = false;

  if (isFriday && isFridayOff) {
    status = "OFF_DAY_WORK";
  } else {
    if (checkInTime > lateAfter) {
      status = "LATE";
      isLate = true;
      lateMinutes = Math.floor((checkInTime.getTime() - shiftStartDate.getTime()) / 60000);
    } else {
      status = "PRESENT";
      lateMinutes = 0;
    }
  }

  return { isLate, lateMinutes, status };
}
