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
    // Normalize date to YYYY-MM-DD
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
    
    const isFriday = serverTime.getDay() === 5;
    
    let reviewStatus = existingAttendance.reviewStatus;
    let punishmentReason = existingAttendance.punishmentReason || "";
    let punishmentAmount = Number(existingAttendance.punishmentAmount) || 0;

    if (isFriday && config.fridayOff) {
      overtimeMinutes = totalWorkingMinutes;
    } else {
      const [endHour, endMin] = config.shiftEnd.split(':').map(Number);
      const expectedCheckOut = new Date(today);
      expectedCheckOut.setHours(endHour, endMin, 0, 0);
      
      const earlyDiff = Math.floor((expectedCheckOut.getTime() - serverTime.getTime()) / 60000);
      if (earlyDiff > 0) {
        earlyLeaveMinutes = earlyDiff;
        punishmentReason = punishmentReason ? `${punishmentReason}, Early leave` : "Early leave";
        
        const calculatedPunishment = await calculatePunishment("EARLY_LEAVE", earlyLeaveMinutes);
        if (config.enablePunishmentDeduction) {
          punishmentAmount += calculatedPunishment;
          if (punishmentAmount > 0) {
            reviewStatus = "DEDUCTED";
          }
        } else if (calculatedPunishment > 0) {
          reviewStatus = "TEMPORARY_REVIEW";
        }
      }
      
      const [startHour, startMin] = config.shiftStart.split(':').map(Number);
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
