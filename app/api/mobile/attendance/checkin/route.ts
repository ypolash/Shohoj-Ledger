import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAttendanceRequest } from "../utils";

export async function POST(request: Request) {
  try {
    console.log("Reached TOKEN validation");
    const body = await request.json();
    
    const employeeId = body.employeeId;
    const ssid = body.ssid;
    const bssid = body.bssid;
    const latitude = body.latitude;
    const longitude = body.longitude;

    console.log("Parsed employeeId:", employeeId);
    console.log("Parsed SSID:", ssid);
    console.log("Parsed BSSID:", bssid);

    if (!employeeId) {
      console.log("Returning 400: employeeId is required");
      return NextResponse.json(
        { success: false, message: "employeeId is required" },
        { status: 400 }
      );
    }

    console.log("=== WIFI DEBUG START ===");
    console.log("Incoming SSID:", ssid);
    console.log("Incoming BSSID:", bssid);

    const allowedNetworks = await prisma.allowedNetwork.findMany({
      where: { isActive: true }
    });

    console.log("Allowed Networks Count:", allowedNetworks.length);
    allowedNetworks.forEach((n, i) => {
      console.log(`Network ${i}:`, { ssid: n.ssid, bssid: n.bssid, active: n.isActive });
    });

    const incomingSsid = (ssid || "").toLowerCase().trim();
    const incomingBssid = (bssid || "").toLowerCase().trim();
    allowedNetworks.forEach((n, i) => {
      const storedSsid = (n.ssid || "").toLowerCase().trim();
      const storedBssid = (n.bssid || "").toLowerCase().trim();
      console.log(`Compare ${i}:`, {
        incomingSsid,
        storedSsid,
        ssidMatch: incomingSsid === storedSsid,
        incomingBssid,
        storedBssid,
        bssidMatch: incomingBssid === storedBssid
      });
    });

    console.log("Reached WIFI validation");
    const validation = await validateAttendanceRequest(latitude, longitude, ssid, bssid);
    if (!validation.isValid) {
      let code = "FORBIDDEN_UNKNOWN";
      const errorLower = validation.error?.toLowerCase() || "";
      
      if (errorLower.includes("wi-fi") || errorLower.includes("network")) {
        code = "FORBIDDEN_WIFI";
      } else if (errorLower.includes("location") || errorLower.includes("gps") || errorLower.includes("radius")) {
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

    const isFriday = serverTime.getDay() === 5;
    let status = "PRESENT";
    let lateMinutes = 0;
    let isLate = false;

    if (isFriday) {
      status = "OFF_DAY_WORK";
    } else {
      const expectedCheckIn = new Date(today);
      expectedCheckIn.setHours(9, 0, 0, 0);
      const diffMinutes = Math.floor((serverTime.getTime() - expectedCheckIn.getTime()) / 60000);
      
      if (diffMinutes > 15) {
        lateMinutes = diffMinutes;
        isLate = true;
        status = "LATE";
      }
    }

    console.log("Saving check-in time:", new Date());
    if (existingAttendance) {
      await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkInTime: serverTime,
          checkInLocation: `${latitude},${longitude}`,
          latitude,
          longitude,
          wifiSsid: ssid,
          wifiBssid: bssid,
          status,
          isLate,
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
          wifiSsid: ssid,
          wifiBssid: bssid,
          status,
          isLate,
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
