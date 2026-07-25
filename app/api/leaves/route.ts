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
    const where: any = { companyId: companyIdForGuard };
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

    const leave = await prisma.leaveRequest.create({
      data: {
        companyId: companyIdForGuard,
        employeeId: data.employeeId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
        status: 'PENDING'
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
    const targetLeave = await prisma.leaveRequest.findFirst({
      where: { id: data.id, companyId: companyIdForGuard }
    });
    if (!targetLeave) {
      return NextResponse.json({ error: 'Leave request not found or access denied' }, { status: 404 });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: data.id },
      data: { status: data.status }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update leave request:', error);
    return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
  }
}
