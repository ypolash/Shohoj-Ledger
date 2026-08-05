import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isWithinOfficeRadius } from '@/lib/gps';

import { requireModule } from "@/lib/modules/moduleGuard";
import { calculateAttendanceStatus } from "@/lib/attendance";

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

    if (employeeId) {
      const attendances = await prisma.attendance.findMany({
        where: { ...(await withCompany()), systemSource, employeeId },
        orderBy: { date: 'desc' }
      });
      return NextResponse.json(attendances);
    } else {
      const attendances = await prisma.attendance.findMany({
        where: { ...(await withCompany()), systemSource },
        orderBy: { date: 'desc' }
      });
      return NextResponse.json(attendances);
    }
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
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
    
    if (!data.employeeId || !data.date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // SECURITY HOTFIX: Validate employee belongs to authenticated company
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, companyId: companyIdForGuard }
    });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found or access denied' }, { status: 403 });
    }

    let status = data.status || 'PRESENT';

    // GPS Validation (Assuming checkInLocation is 'lat,lng')
    if (data.checkInLocation) {
      const [latStr, lngStr] = data.checkInLocation.split(',');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        if (!isWithinOfficeRadius(lat, lng)) {
          status = 'OUTSIDE_OFFICE';
        }
      }
    }

    let finalLateMinutes = data.lateMinutes || 0;
    let finalStatus = status;
    let isLate = false;

    if (finalLateMinutes === 0 && data.checkIn) {
      const calc = await calculateAttendanceStatus(companyIdForGuard, data.employeeId, new Date(data.checkIn));
      finalLateMinutes = calc.lateMinutes;
      isLate = calc.isLate;
      if (!data.status || data.status === 'PRESENT') {
        finalStatus = calc.status;
      }
    } else if (finalLateMinutes > 0) {
      isLate = true;
      if (!data.status || data.status === 'PRESENT') {
        finalStatus = 'LATE';
      }
    }

    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const attendance = await prisma.attendance.create({
      data: {
        companyId: companyIdForGuard,
        employeeId: data.employeeId,
        date: new Date(data.date),
        checkInTime: data.checkIn ? new Date(data.checkIn) : null,
        checkInLocation: data.checkInLocation || null,
        checkOutTime: data.checkOut ? new Date(data.checkOut) : null,
        checkOutLocation: data.checkOutLocation || null,
        status: finalStatus,
        isLate,
        lateMinutes: finalLateMinutes,
        systemSource
      }
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error('Failed to create attendance:', error);
    return NextResponse.json({ error: 'Failed to create attendance' }, { status: 500 });
  }
}
