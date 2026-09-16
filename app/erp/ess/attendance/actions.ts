"use server";

import { prisma } from "@/lib/prisma";
import { getEssEmployeeId } from "../actions";

export async function fetchMyAttendanceHistory(limit: number = 30) {
  const { employeeId, companyId } = await getEssEmployeeId();

  return await prisma.attendance.findMany({
    where: { companyId, systemSource: "ERP", employeeId },
    orderBy: { date: "desc" },
    take: limit
  });
}

export async function fetchMyAttendanceSummary() {
  const { employeeId, companyId } = await getEssEmployeeId();
  
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const records = await prisma.attendance.findMany({
    where: {
      companyId,
      systemSource: "ERP",
      employeeId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  return records.reduce((acc, curr) => {
    if (curr.status === "PRESENT") acc.present++;
    if (curr.status === "LATE") { acc.present++; acc.late++; }
    if (curr.status === "ABSENT") acc.absent++;
    if (curr.status === "HALF_DAY") { acc.present++; acc.halfDay++; }
    return acc;
  }, { present: 0, late: 0, absent: 0, halfDay: 0 });
}

export async function fetchMyDutySchedule() {
  const { employeeId } = await getEssEmployeeId();
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { workShift: true }
  });
  if (emp?.workShift) {
    return {
      name: emp.workShift.name,
      startTime: emp.workShift.startTime,
      endTime: emp.workShift.endTime,
      gracePeriod: emp.workShift.gracePeriod,
      breakTime: emp.workShift.breakTime,
      nightShift: emp.workShift.nightShift,
      isCustom: true,
    };
  }
  return null;
}
