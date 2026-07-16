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

    await prisma.attendance.update({
      where: { id: existingAttendance.id },
      data: {
        checkOutTime: serverTime,
        checkOutLocation: `${latitude},${longitude}`,
        latitude,
        longitude,
        wifiSsid,
        wifiBssid,
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
