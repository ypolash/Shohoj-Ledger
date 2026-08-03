import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAttendanceRequest } from "../utils";

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

    const validation = await validateAttendanceRequest(employee.companyId, latitude, longitude, ssid, bssid);
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
    let status = "PRESENT";
    let lateMinutes = 0;
    let isLate = false;

    let shiftStartStr = config?.shiftStart || "09:00";
    let startHour = 9;
    let startMin = 0;
    
    const parts = shiftStartStr.split(':');
    startHour = parseInt(parts[0], 10);
    startMin = parseInt(parts[1], 10);
    
    const shiftStartDate = new Date(currentDhakaTime);
    shiftStartDate.setHours(startHour, startMin, 0, 0);
    
    const lateAfter = new Date(shiftStartDate);
    lateAfter.setMinutes(lateAfter.getMinutes() + (config?.gracePeriod || 0));

    if (isFriday && config?.fridayOff) {
      status = "OFF_DAY_WORK";
    } else {
      if (currentDhakaTime > lateAfter) {
        status = "LATE";
        isLate = true;
        lateMinutes = Math.floor((currentDhakaTime.getTime() - shiftStartDate.getTime()) / 60000);
      } else {
        status = "PRESENT";
        lateMinutes = 0;
      }
    }

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
