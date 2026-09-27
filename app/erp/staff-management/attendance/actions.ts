"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { getNowInTimezone } from "@/lib/attendance";

async function verifyAccess(permission: string) {
  const session = await getSession();
  if (!session?.user?.companyId) {
    throw new Error("Unauthorized or no company context.");
  }
  // In a real app we'd verify the explicit permission here using RbacService
  return { companyId: session.user.companyId };
}

// 1. fetchAttendance
// Used for displaying the daily attendance roster
export async function fetchAttendance(dateStr?: string) {
  const { companyId } = await verifyAccess("VIEW_ATTENDANCE");
  
  let startOfDay: Date;
  let endOfDay: Date;

  if (dateStr) {
    const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
    startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  } else {
    const { todayDateOnly } = getNowInTimezone();
    startOfDay = todayDateOnly;
    endOfDay = new Date(todayDateOnly.getTime() + (24 * 60 * 60 * 1000) - 1);
  }

  return await prisma.attendance.findMany({
    where: {
      companyId,
      systemSource: { in: ["ERP", "LEGACY", "APP"] },
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeId: true,
          department: true,
          designation: true,
          status: true
        }
      }
    }
  });
}

// 2. attendanceHistory
// Get attendance history for a specific employee
export async function attendanceHistory(employeeId: string, limit: number = 30) {
  const { companyId } = await verifyAccess("VIEW_ATTENDANCE");

  return await prisma.attendance.findMany({
    where: {
      companyId,
      systemSource: { in: ["ERP", "LEGACY", "APP"] },
      employeeId
    },
    orderBy: { date: "desc" },
    take: limit
  });
}

// 3. attendanceSummary
// Gets overall monthly summary for a specific employee or all employees
export async function attendanceSummary(employeeId?: string, monthOffset: number = 0) {
  const { companyId } = await verifyAccess("VIEW_ATTENDANCE");
  
  const { now } = getNowInTimezone();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() - monthOffset;
  
  const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  const whereClause: any = {
    companyId,
    systemSource: { in: ["ERP", "LEGACY", "APP"] },
    date: {
      gte: startOfMonth,
      lte: endOfMonth
    }
  };
  if (employeeId) {
    whereClause.employeeId = employeeId;
  }

  const records = await prisma.attendance.findMany({
    where: whereClause
  });

  return records.reduce((acc, curr) => {
    if (curr.status === "PRESENT") acc.present++;
    if (curr.status === "LATE") { acc.present++; acc.late++; }
    if (curr.status === "ABSENT") acc.absent++;
    if (curr.status === "HALF_DAY") { acc.present++; acc.halfDay++; }
    return acc;
  }, { present: 0, late: 0, absent: 0, halfDay: 0 });
}

// 4. attendanceStatistics
// Gets general high-level stats for the current day across the company
export async function attendanceStatistics() {
  const { companyId } = await verifyAccess("VIEW_ATTENDANCE");
  
  const { todayDateOnly } = getNowInTimezone();
  const startOfDay = todayDateOnly;
  const endOfDay = new Date(todayDateOnly.getTime() + (24 * 60 * 60 * 1000) - 1);

  const [totalEmployees, todayRecords] = await Promise.all([
    prisma.employee.count({ where: { companyId, status: "ACTIVE" } }),
    prisma.attendance.findMany({
      where: { companyId, systemSource: { in: ["ERP", "LEGACY", "APP"] }, date: { gte: startOfDay, lte: endOfDay } }
    })
  ]);

  const stats = todayRecords.reduce((acc, curr) => {
    if (curr.status === "PRESENT") acc.present++;
    else if (curr.status === "LATE") acc.late++;
    else if (curr.status === "ABSENT") acc.absent++;
    return acc;
  }, { present: 0, late: 0, absent: 0 });

  return {
    totalActive: totalEmployees,
    present: stats.present,
    late: stats.late,
    absent: stats.absent,
    unmarked: Math.max(0, totalEmployees - (stats.present + stats.late + stats.absent))
  };
}
