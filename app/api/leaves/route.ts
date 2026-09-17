import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { requireModule } from "@/lib/modules/moduleGuard";

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

    const where: any = { companyId: companyIdForGuard, systemSource };
    if (employeeId) where.employeeId = employeeId;

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: { firstName: true, lastName: true, designation: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(leaves);
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
      where: { id: data.employeeId, companyId: companyIdForGuard }
    });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found or access denied' }, { status: 403 });
    }

    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const leave = await prisma.leaveRequest.create({
      data: {
        companyId: companyIdForGuard,
        employeeId: data.employeeId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
        status: 'PENDING',
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
            const match = targetLeave.leaveType.description.match(/\[TIMER_CONFIG:({.*?})\]/s);
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update leave request:', error);
    return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
  }
}
