import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const companyId = session.user.companyId;

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const employeeIdParam = searchParams.get("employeeId");
    const departmentIdParam = searchParams.get("departmentId");

    // Default to current 7-day window if not provided
    const now = new Date();
    const start = startDateParam 
      ? new Date(`${startDateParam}T00:00:00.000Z`) 
      : new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0));
    
    const end = endDateParam 
      ? new Date(`${endDateParam}T23:59:59.999Z`) 
      : new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 12, 23, 59, 59, 999));

    // 1. Fetch active employees
    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        status: "ACTIVE",
        ...(employeeIdParam && { id: employeeIdParam }),
        ...(departmentIdParam && { departmentId: departmentIdParam })
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        designation: true,
        department: true,
        workShiftId: true,
        workShift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            gracePeriod: true,
            nightShift: true,
          }
        }
      },
      orderBy: { firstName: "asc" }
    });

    // 2. Fetch duty rosters in the date range
    const rosters = await prisma.attendanceRoster.findMany({
      where: {
        companyId,
        date: {
          gte: start,
          lte: end,
        },
        ...(employeeIdParam && { employeeId: employeeIdParam }),
      },
      include: {
        workShift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            gracePeriod: true,
            nightShift: true,
          }
        },
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            designation: true,
          }
        }
      },
      orderBy: { date: "asc" }
    });

    // 3. Fetch all pre-defined shifts for quick selection
    const shifts = await prisma.workShift.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({
      success: true,
      employees,
      rosters,
      shifts,
      dateRange: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      }
    });
  } catch (error: any) {
    console.error("Fetch duty roster error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch duty roster" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (rbacGuard) return rbacGuard;

    const session = await getSession();
    const companyId = session?.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      employeeIds,
      employeeId,
      dates,
      startDate,
      endDate,
      workShiftId,
      startTime,
      endTime,
      gracePeriod,
      note,
      status = "SCHEDULED"
    } = body;

    // Resolve target employee list
    const targetEmployeeIds: string[] = [];
    if (Array.isArray(employeeIds) && employeeIds.length > 0) {
      targetEmployeeIds.push(...employeeIds);
    } else if (employeeId) {
      targetEmployeeIds.push(employeeId);
    }

    if (targetEmployeeIds.length === 0) {
      return NextResponse.json({ error: "At least one employee must be selected" }, { status: 400 });
    }

    // Resolve target dates list
    const targetDates: string[] = [];
    if (Array.isArray(dates) && dates.length > 0) {
      targetDates.push(...dates);
    } else if (startDate && endDate) {
      const curr = new Date(startDate);
      const stop = new Date(endDate);
      while (curr <= stop) {
        targetDates.push(curr.toISOString().split("T")[0]);
        curr.setDate(curr.getDate() + 1);
      }
    } else if (startDate) {
      targetDates.push(startDate);
    }

    if (targetDates.length === 0) {
      return NextResponse.json({ error: "At least one date must be specified" }, { status: 400 });
    }

    // Must specify either workShiftId OR (startTime and endTime)
    if (!workShiftId && (!startTime || !endTime)) {
      return NextResponse.json({
        error: "Please select a standard Work Shift or specify custom Start Time and End Time"
      }, { status: 400 });
    }

    // Perform atomic transaction: replace/upsert duty overrides for selected dates
    let createdCount = 0;
    await prisma.$transaction(async (tx) => {
      for (const empId of targetEmployeeIds) {
        for (const dateStr of targetDates) {
          const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
          const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

          // Remove any existing roster for this employee on this date
          await tx.attendanceRoster.deleteMany({
            where: {
              companyId,
              employeeId: empId,
              date: {
                gte: dayStart,
                lte: dayEnd,
              }
            }
          });

          // Insert fresh duty schedule override
          await tx.attendanceRoster.create({
            data: {
              companyId,
              employeeId: empId,
              date: dayStart,
              workShiftId: workShiftId || null,
              startTime: startTime ? startTime.trim() : null,
              endTime: endTime ? endTime.trim() : null,
              gracePeriod: gracePeriod !== undefined && gracePeriod !== null ? Number(gracePeriod) : 0,
              note: note ? note.trim() : null,
              status: status || "SCHEDULED",
            }
          });
          createdCount++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully scheduled duty override for ${targetEmployeeIds.length} employee(s) across ${targetDates.length} date(s).`,
      count: createdCount,
    });
  } catch (error: any) {
    console.error("Assign duty roster error:", error);
    return NextResponse.json({ error: error.message || "Failed to assign duty roster" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (rbacGuard) return rbacGuard;

    const session = await getSession();
    const companyId = session?.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const employeeId = searchParams.get("employeeId");
    const dateStr = searchParams.get("date");

    if (id) {
      // Delete single roster record by ID
      await prisma.attendanceRoster.deleteMany({
        where: { id, companyId }
      });
      return NextResponse.json({ success: true, message: "Duty override removed" });
    }

    if (employeeId && dateStr) {
      // Revert employee's duty on specific date
      const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
      const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

      await prisma.attendanceRoster.deleteMany({
        where: {
          companyId,
          employeeId,
          date: {
            gte: dayStart,
            lte: dayEnd,
          }
        }
      });
      return NextResponse.json({ success: true, message: "Duty override reverted to standard shift" });
    }

    return NextResponse.json({ error: "Roster ID or (Employee ID + Date) required" }, { status: 400 });
  } catch (error: any) {
    console.error("Delete duty roster error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete duty roster" }, { status: 500 });
  }
}
