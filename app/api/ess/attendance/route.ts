import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateAttendanceStatus, calculateEarlyLeaveStatus } from "@/lib/attendance";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

/**
 * OPTIONS /api/ess/attendance
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

/**
 * GET /api/ess/attendance
 * Returns the authenticated employee's own attendance records.
 * Used exclusively by the Staff App mobile portal.
 */
export async function GET(request: Request) {
  try {
    const employee = await resolveEssEmployee(request);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: ESS_CORS_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30");

    const records = await prisma.attendance.findMany({
      where: { companyId: employee.companyId, employeeId: employee.id },
      orderBy: { date: "desc" },
      take: limit,
    });

    // Check if clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRecord = await prisma.attendance.findFirst({
      where: {
        companyId: employee.companyId,
        employeeId: employee.id,
        date: { gte: today },
      },
    });

    const mapRecord = (rec: any) => ({
      ...rec,
      checkIn: rec.checkInTime,
      checkOut: rec.checkOutTime,
      isCheckedIn: !!rec.checkInTime && !rec.checkOutTime
    });

    return NextResponse.json({
      records: records.map(mapRecord),
      today: todayRecord ? mapRecord(todayRecord) : null,
      summary: {
        present: records.filter((r) => r.status === "PRESENT").length,
        absent: records.filter((r) => r.status === "ABSENT").length,
        late: records.filter((r) => r.status === "LATE").length,
        halfDay: records.filter((r) => r.status === "HALF_DAY").length,
      }
    });
  } catch (error) {
    console.error("[ESS] Attendance fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/ess/attendance
 * Clock In or Clock Out for the authenticated employee.
 * Body: { action: "CLOCK_IN" | "CLOCK_OUT", location?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const employee = await resolveEssEmployee(request, body);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: ESS_CORS_HEADERS });
    }
    const { action, location, latitude, longitude, ssid, bssid } = body;

    if (!action || !["CLOCK_IN", "CLOCK_OUT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use CLOCK_IN or CLOCK_OUT." }, { status: 400 });
    }
    
    // --- NETWORK & LOCATION VALIDATION ---
    const { validateAttendanceRequest } = await import("../../mobile/attendance/utils");
    const validation = await validateAttendanceRequest(employee.companyId || "", latitude, longitude, ssid, bssid);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }
    // -------------------------------------

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayRecord = await prisma.attendance.findFirst({
      where: {
        companyId: employee.companyId,
        employeeId: employee.id,
        date: { gte: todayStart },
      },
    });

    const locationString = location || (latitude && longitude ? `${latitude},${longitude}` : null);

    if (action === "CLOCK_IN") {
      if (todayRecord?.checkInTime) {
        return NextResponse.json({ error: "Already clocked in today." }, { status: 400 });
      }

      const calc = await calculateAttendanceStatus(employee.companyId || "", employee.id, now);

      const record = await prisma.attendance.upsert({
        where: { id: todayRecord?.id || "" },
        update: { 
            checkInTime: now, 
            checkInLocation: locationString, 
            status: calc.status,
            isLate: calc.isLate,
            lateMinutes: calc.lateMinutes,
            latitude: latitude,
            longitude: longitude,
            wifiSsid: ssid,
            wifiBssid: bssid
        },
        create: {
          companyId: employee.companyId,
          employeeId: employee.id,
          date: todayStart,
          checkInTime: now,
          checkInLocation: locationString,
          status: calc.status,
          isLate: calc.isLate,
          lateMinutes: calc.lateMinutes,
          systemSource: employee.systemSource || "LEGACY",
          latitude: latitude,
          longitude: longitude,
          wifiSsid: ssid,
          wifiBssid: bssid
        },
      });
      return NextResponse.json({ success: true, record, message: "Clocked in successfully." });
    }

    // CLOCK_OUT
    if (!todayRecord?.checkInTime) {
      return NextResponse.json({ error: "You have not clocked in today." }, { status: 400 });
    }
    if (todayRecord.checkOutTime) {
      return NextResponse.json({ error: "Already clocked out today." }, { status: 400 });
    }

    const earlyCalc = await calculateEarlyLeaveStatus(
      employee.companyId || todayRecord.companyId || "",
      employee.id,
      now
    );
    const totalWorkingMinutes = Math.floor((now.getTime() - todayRecord.checkInTime.getTime()) / 60000);

    const record = await prisma.attendance.update({
      where: { id: todayRecord.id },
      data: {
        checkOutTime: now,
        checkOutLocation: locationString,
        earlyLeaveMinutes: earlyCalc.earlyLeaveMinutes,
        totalWorkingMinutes: totalWorkingMinutes > 0 ? totalWorkingMinutes : 0,
      },
    });

    return NextResponse.json({ success: true, record, message: "Clocked out successfully." });
  } catch (error) {
    console.error("[ESS] Clock action error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
