import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAttendanceRequest } from "../utils";
import { calculateAttendanceStatus } from "@/lib/attendance";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const employeeId = body.employeeId;
    const ssid = body.ssid;
    const bssid = body.bssid;
    const latitude = body.latitude;
    const longitude = body.longitude;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "employeeId is required" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, code: "FORBIDDEN_EMPLOYEE", message: "Employee not found." },
        { status: 403 }
      );
    }

    try {
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          location: `DEBUG: SSID=${ssid}, BSSID=${bssid}, Networks=${employee.companyId}`
        }
      });
    } catch(e) {}

    const validation = await validateAttendanceRequest(employee.companyId || "", latitude, longitude, ssid, bssid);
    if (!validation.isValid) {
      let code = "FORBIDDEN_UNKNOWN";
      const errorLower = validation.error?.toLowerCase() || "";
      
      if (errorLower.includes("wi-fi") || errorLower.includes("network")) {
        code = "FORBIDDEN_WIFI";
      } else if (errorLower.includes("location") || errorLower.includes("gps") || errorLower.includes("radius")) {
        code = "FORBIDDEN_LOCATION";
      }

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
    const dhakaTimeString = serverTime.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const currentDhakaTime = new Date(dhakaTimeString);

    const dateStr = currentDhakaTime.getFullYear() + "-" +
                    String(currentDhakaTime.getMonth() + 1).padStart(2, '0') + "-" + 
                    String(currentDhakaTime.getDate()).padStart(2, '0');
    const today = new Date(dateStr);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: today,
      },
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      return NextResponse.json(
        { success: false, message: "Already checked in today.", serverTime: serverTime.toISOString() },
        { status: 400 }
      );
    }

    const config = await prisma.attendanceConfig.findFirst({
        where: {
            // If companyId exists on config, we might need it.
            // For now, take the first one or default.
        }
    });
    
    const isFriday = currentDhakaTime.getDay() === 5;
    
    // Default to PRESENT but let the utility calculate the correct status, isLate and lateMinutes
    const calc = await calculateAttendanceStatus(employee.companyId || "", employee.id, serverTime);
    let status = calc.status;
    let lateMinutes = calc.lateMinutes;
    let isLate = calc.isLate;

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
          companyId: employee.companyId
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Check-in successful",
      serverTime: serverTime.toISOString(),
      status,
      lateMinutes
    });

  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
