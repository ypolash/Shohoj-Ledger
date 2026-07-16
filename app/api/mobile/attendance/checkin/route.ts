import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAttendanceRequest } from "../utils";

export async function POST(req: Request) {
  try {
    console.log("Reached TOKEN validation");
    const body = await req.json();
    const { employeeId, wifiSsid, wifiBssid, latitude, longitude } = body;

    if (!employeeId) {
      console.log("Returning 400: employeeId is required");
      return NextResponse.json(
        { success: false, message: "employeeId is required" },
        { status: 400 }
      );
    }

    console.log("Reached WIFI validation");
    const validation = await validateAttendanceRequest(latitude, longitude, wifiSsid, wifiBssid);
    if (!validation.isValid) {
      let code = "FORBIDDEN_UNKNOWN";
      const errorLower = validation.error?.toLowerCase() || "";
      
      // TEMP TEST MODE - Wi-Fi validation bypassed
      // if (errorLower.includes("wi-fi") || errorLower.includes("network")) {
      //   code = "FORBIDDEN_WIFI";
      // } else if (errorLower.includes("location") || errorLower.includes("gps") || errorLower.includes("radius")) {
      if (errorLower.includes("location") || errorLower.includes("gps") || errorLower.includes("radius")) {
        code = "FORBIDDEN_LOCATION";
      }

      console.log(`Returning 403: ${code} - ${validation.error}`);
      if (validation.details) {
        return NextResponse.json(
          { 
            success: false,
            code,
            message: validation.error,
            ...validation.details
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { success: false, code, message: validation.error },
        { status: 403 }
      );
    }

    const serverTime = new Date();
    // Normalize date to YYYY-MM-DD to use as unique constraint
    const dateStr = serverTime.toISOString().split("T")[0];
    const today = new Date(dateStr);

    console.log("Reached EMPLOYEE validation");
    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    if (!employee) {
      console.log("Returning 403: Employee not found. Code: FORBIDDEN_EMPLOYEE");
      return NextResponse.json(
        { success: false, code: "FORBIDDEN_EMPLOYEE", message: "Employee not found." },
        { status: 403 }
      );
    }

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: today,
      },
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      console.log("Returning 400: Already checked in today.");
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
          checkInTime: serverTime,
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
          checkInTime: serverTime,
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

    console.log("Returning 200: Check-in successful");
    return NextResponse.json({
      success: true,
      message: "Check-in successful",
      serverTime: serverTime.toISOString(),
    });

  } catch (error) {
    console.error("Check-in error:", error);
    console.log("Returning 500: Internal server error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
