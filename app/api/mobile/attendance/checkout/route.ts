import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAttendanceRequest, getAttendanceConfig } from "../utils";

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

    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, code: "FORBIDDEN_EMPLOYEE", message: "Employee not found." },
        { status: 403 }
      );
    }

    const validation = await validateAttendanceRequest(employee.companyId, latitude, longitude, wifiSsid, wifiBssid);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.error },
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

    const checkInTime = existingAttendance.checkInTime;
    const totalWorkingMinutes = Math.floor((serverTime.getTime() - checkInTime.getTime()) / 60000);

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
      },
    });

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
