import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAttendanceRequest } from "../utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, wifiSsid, wifiBssid, latitude, longitude } = body;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "employeeId is required" },
        { status: 400 }
      );
    }

    const validation = await validateAttendanceRequest(latitude, longitude, wifiSsid, wifiBssid);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 403 }
      );
    }

    const serverTime = new Date();
    // Normalize date to YYYY-MM-DD to use as unique constraint
    const dateStr = serverTime.toISOString().split("T")[0];
    const today = new Date(dateStr);

    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found." },
        { status: 404 }
      );
    }

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: today,
      },
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return NextResponse.json(
        { success: false, message: "Already checked in today.", serverTime: serverTime.toISOString() },
        { status: 400 }
      );
    }

    // Determine late minutes (e.g., if checking in past 10:00 AM)
    const expectedCheckIn = new Date(today);
    expectedCheckIn.setHours(10, 0, 0, 0);
    const lateMinutes = Math.max(0, Math.floor((serverTime.getTime() - expectedCheckIn.getTime()) / 60000));
    const status = lateMinutes > 15 ? "LATE" : "PRESENT";

    if (existingAttendance) {
      await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkIn: serverTime,
          checkInLocation: `${latitude},${longitude}`,
          latitude,
          longitude,
          wifiSsid,
          wifiBssid,
          status,
          lateMinutes,
        },
      });
    } else {
      await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date: today,
          checkIn: serverTime,
          checkInLocation: `${latitude},${longitude}`,
          latitude,
          longitude,
          wifiSsid,
          wifiBssid,
          status,
          lateMinutes,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Check-in successful",
      serverTime: serverTime.toISOString(),
    });

  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
