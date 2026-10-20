import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncLeaveRequestWithAttendance } from "@/lib/attendance";

import { requireModule } from "@/lib/modules/moduleGuard";

import { requirePermission } from "@/lib/rbac/permissionGuard";
import { isRegularStaff, isFreelancerOrModel } from "@/lib/staff/staffFilter";

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

    const where: any = { companyId: companyIdForGuard, systemSource };
    if (employeeId) where.employeeId = employeeId;

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: true,
            employmentType: true,
            departmentRef: { select: { name: true } },
            designationRef: { select: { name: true } },
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const regularLeaves = leaves.filter(l => isRegularStaff(l.employee));
    return NextResponse.json(regularLeaves);
  } catch (error) {
    console.error('Failed to fetch leave requests:', error);
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
    
    if (!data.employeeId || !data.type || !data.startDate || !data.endDate || !data.reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // SECURITY HOTFIX: Validate employee belongs to authenticated company
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, companyId: companyIdForGuard },
      include: { departmentRef: true, designationRef: true }
    });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found or access denied' }, { status: 403 });
    }
    if (isFreelancerOrModel(employee)) {
      return NextResponse.json({ error: 'Leave requests are only available for regular staff members.' }, { status: 400 });
    }

    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    // Check if leave category is a Short Break (Timer model)
    const matchingLeaveType = await prisma.leaveType.findFirst({
      where: {
        companyId: companyIdForGuard,
        OR: [
          { name: data.type },
          { id: data.leaveTypeId || "" }
        ]
      }
    });

    const isShortBreak = matchingLeaveType?.description?.includes("TIMER_CONFIG") ||
                         matchingLeaveType?.description?.includes("SHORT_BREAK") ||
                         data.type.toLowerCase().includes("break");

    let finalStatus = 'PENDING';
    let finalStartDate = new Date(data.startDate);
    let finalEndDate = new Date(data.endDate);
    let comments: string | null = null;

    if (isShortBreak) {
      let durationMinutes = 30;
      let graceMinutes = 5;
      let fineAmt = 50;

      if (matchingLeaveType?.description?.includes("TIMER_CONFIG")) {
        try {
          const match = matchingLeaveType.description.match(/\[TIMER_CONFIG:({[\s\S]*?})\]/);
          if (match) {
            const cfg = JSON.parse(match[1]);
            durationMinutes = Number(cfg.duration) || 30;
            graceMinutes = Number(cfg.grace) || 5;
            fineAmt = Number(cfg.fine) || 50;
          }
        } catch {}
      }

      const now = new Date();
      finalStartDate = now;
      finalEndDate = new Date(now.getTime() + durationMinutes * 60 * 1000);
      finalStatus = 'APPROVED'; // Auto-Approved immediately without manual HR step
      comments = `Auto-Approved Short Break: ${durationMinutes}m duration (+${graceMinutes}m grace). Overstay fine: ৳${fineAmt}.`;
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        companyId: companyIdForGuard,
        employeeId: data.employeeId,
        leaveTypeId: matchingLeaveType?.id || null,
        type: data.type,
        startDate: finalStartDate,
        endDate: finalEndDate,
        reason: data.reason,
        status: finalStatus,
        comments,
        systemSource
      }
    });

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error('Failed to create leave request:', error);
    return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ATTENDANCE");
  if (moduleGuard) return moduleGuard;

  try {
    const data = await request.json();
    if (!data.id || !data.status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    // SECURITY HOTFIX: Pre-flight check for ownership
    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const targetLeave = await prisma.leaveRequest.findFirst({
      where: { id: data.id, companyId: companyIdForGuard, systemSource },
      include: { leaveType: true }
    });
    if (!targetLeave) {
      return NextResponse.json({ error: 'Leave request not found or access denied' }, { status: 404 });
    }

    const updateData: any = { status: data.status };

    // If approving a short break, start live countdown immediately from approval moment
    if (data.status === "APPROVED") {
      const isShortBreak = targetLeave.leaveType?.description?.includes("TIMER_CONFIG") ||
                           targetLeave.leaveType?.description?.includes("SHORT_BREAK") ||
                           targetLeave.comments?.includes("Short Break") ||
                           targetLeave.type.toLowerCase().includes("break");

      if (isShortBreak) {
        let durationMinutes = 30;
        if (targetLeave.leaveType?.description?.includes("TIMER_CONFIG")) {
          try {
            const match = targetLeave.leaveType.description.match(/\[TIMER_CONFIG:({[\s\S]*?})\]/);
            if (match) {
              const cfg = JSON.parse(match[1]);
              durationMinutes = Number(cfg.duration) || 30;
            }
          } catch {}
        }
        const now = new Date();
        updateData.startDate = now;
        updateData.endDate = new Date(now.getTime() + durationMinutes * 60 * 1000);
      }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: data.id },
      data: updateData
    });

    // Synchronize leave status with Attendance records (excuses absences when approved, marks absent when cancelled)
    await syncLeaveRequestWithAttendance(updated.id).catch(err =>
      console.error("[Leaves API] Error syncing leave with attendance:", err)
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update leave request:', error);
    return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
  }
}
