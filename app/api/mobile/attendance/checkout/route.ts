import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAttendanceRequest, getAttendanceConfig, calculatePunishment } from "../utils";

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
      if (validation.details) {
        return NextResponse.json(
          { 
            success: false,
            ...validation.details
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 403 }
      );
    }

    const serverTime = new Date();
    const dhakaTimeString = serverTime.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const currentDhakaTime = new Date(dhakaTimeString);
    
    // Normalize date to YYYY-MM-DD
    const dateStr = currentDhakaTime.getFullYear() + "-" + 
                    String(currentDhakaTime.getMonth() + 1).padStart(2, '0') + "-" + 
                    String(currentDhakaTime.getDate()).padStart(2, '0');
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

    if (!existingAttendance || !existingAttendance.checkInTime) {
      return NextResponse.json(
        { success: false, message: "Check-in required first" },
        { status: 400 }
      );
    }

    if (existingAttendance.checkOutTime) {
      return NextResponse.json(
        { success: false, message: "Already checked out" },
        { status: 400 }
      );
    }

    const config = await getAttendanceConfig();
    const checkInTime = existingAttendance.checkInTime;
    const totalWorkingMinutes = Math.floor((serverTime.getTime() - checkInTime.getTime()) / 60000);
    
    let earlyLeaveMinutes = 0;
    let overtimeMinutes = 0;
    
    const isFriday = currentDhakaTime.getDay() === 5;
    
    let reviewStatus = existingAttendance.reviewStatus;
    let punishmentReason = existingAttendance.punishmentReason || "";
    let punishmentAmount = Number(existingAttendance.punishmentAmount) || 0;

    if (isFriday && config.fridayOff) {
      overtimeMinutes = totalWorkingMinutes;
    } else {
      let shiftEndStr = config.shiftEnd || "18:00";
      let endHour = 18;
      let endMin = 0;
      if (shiftEndStr.includes(" ")) {
        const [timePart, modifier] = shiftEndStr.split(" ");
        let [hours, minutes] = timePart.split(":");
        endHour = parseInt(hours, 10);
        endMin = parseInt(minutes, 10);
        if (modifier.toUpperCase() === "PM" && endHour < 12) endHour += 12;
        if (modifier.toUpperCase() === "AM" && endHour === 12) endHour = 0;
      } else {
        const parts = shiftEndStr.split(':');
        endHour = parseInt(parts[0], 10);
        endMin = parseInt(parts[1], 10);
      }

      const expectedCheckOut = new Date(currentDhakaTime);
      expectedCheckOut.setHours(endHour, endMin, 0, 0);
      
      const earlyDiff = Math.floor((expectedCheckOut.getTime() - currentDhakaTime.getTime()) / 60000);
      if (earlyDiff > 0) {
        earlyLeaveMinutes = earlyDiff;
        
        const calculatedPunishment = await calculatePunishment("EARLY_LEAVE", earlyLeaveMinutes);
        if (calculatedPunishment > 0) {
          punishmentReason = punishmentReason ? `${punishmentReason}, EARLY_LEAVE` : "EARLY_LEAVE";
          if (config.enablePunishmentDeduction) {
            punishmentAmount += calculatedPunishment;
            reviewStatus = "DEDUCTED";
          } else {
            reviewStatus = "TEMPORARY_REVIEW";
          }
        } else {
          punishmentReason = punishmentReason ? `${punishmentReason}, EARLY_LEAVE` : "EARLY_LEAVE";
        }
      }
      
      let shiftStartStr = config.shiftStart || "09:00";
      let startHour = 9;
      let startMin = 0;
      if (shiftStartStr.includes(" ")) {
        const [timePart, modifier] = shiftStartStr.split(" ");
        let [hours, minutes] = timePart.split(":");
        startHour = parseInt(hours, 10);
        startMin = parseInt(minutes, 10);
        if (modifier.toUpperCase() === "PM" && startHour < 12) startHour += 12;
        if (modifier.toUpperCase() === "AM" && startHour === 12) startHour = 0;
      } else {
        const parts = shiftStartStr.split(':');
        startHour = parseInt(parts[0], 10);
        startMin = parseInt(parts[1], 10);
      }

      const expectedWorkingMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      if (totalWorkingMinutes > expectedWorkingMinutes) {
        overtimeMinutes = totalWorkingMinutes - expectedWorkingMinutes;
      }
    }

    await prisma.attendance.update({
      where: { id: existingAttendance.id },
      data: {
        checkOutTime: serverTime,
        checkOutLocation: `${latitude},${longitude}`,
        latitude,
        longitude,
        wifiSsid,
        wifiBssid,
        totalWorkingMinutes,
        earlyLeaveMinutes,
        overtimeMinutes,
        reviewStatus,
        punishmentReason,
        punishmentAmount,
      },
    });

    console.log("Check-out saved:", new Date());

    return NextResponse.json({
      success: true,
      message: "Check-out successful",
      serverTime: serverTime.toISOString(),
    });

  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
