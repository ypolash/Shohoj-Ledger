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
    const companyFilter = await withCompany();

    // Include company attendances across ERP, mobile app, and legacy sources
    const whereClause: any = {
      OR: [
        { ...companyFilter, systemSource: { in: [systemSource, "ERP", "LEGACY", "APP"] } },
        { employee: companyFilter, systemSource: { in: [systemSource, "ERP", "LEGACY", "APP"] } }
      ],
      ...(employeeId ? { employeeId } : {})
    };

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(attendances);
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

    function parseDateTime(dateStr: string, timeOrDateStr?: string | null): Date | null {
      if (!timeOrDateStr) return null;
      const trimmed = timeOrDateStr.trim();
      // If time only like "09:30" or "09:30:00"
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
        const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.slice(0, 10);
        const timePart = trimmed.length === 5 ? `${trimmed}:00` : trimmed;
        const d = new Date(`${datePart}T${timePart}`);
        return isNaN(d.getTime()) ? null : d;
      }
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d;
    }

    const checkInDate = parseDateTime(data.date, data.checkIn);
    const checkOutDate = parseDateTime(data.date, data.checkOut);

    let finalLateMinutes = data.lateMinutes || 0;
    let finalStatus = status;
    let isLate = false;

    if (finalLateMinutes === 0 && checkInDate) {
      const calc = await calculateAttendanceStatus(companyIdForGuard, data.employeeId, checkInDate);
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
        checkInTime: checkInDate,
        checkInLocation: data.checkInLocation || null,
        checkOutTime: checkOutDate,
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
