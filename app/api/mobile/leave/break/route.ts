import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";
import { 
  getActiveBreakForEmployee, 
  processBreakEnd, 
  processBreakPause, 
  processBreakResume, 
  parseLeaveTypeConfig 
} from "@/lib/hr/leaveTimer";
import { validateAttendanceRequest } from "@/app/api/mobile/attendance/utils";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

/**
 * GET /api/mobile/leave/break
 * Returns active live break timer & overstay telemetry for employee.
 */
export async function GET(request: Request) {
  try {
    const employee = await resolveEssEmployee(request);
    if (!employee) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401, headers: ESS_CORS_HEADERS }
      );
    }

    const activeBreak = await getActiveBreakForEmployee(employee.id, employee.companyId);

    // Fetch all available short break / timer leave categories
    const breakCategories = await prisma.leaveType.findMany({
      where: {
        companyId: employee.companyId || "",
        OR: [
          { description: { contains: "TIMER_CONFIG" } },
          { description: { contains: "SHORT_BREAK" } },
          { name: { contains: "Break", mode: "insensitive" } },
        ]
      }
    });

    const parsedCategories = breakCategories.map(parseLeaveTypeConfig);

    return NextResponse.json({
      success: true,
      hasActiveBreak: Boolean(activeBreak),
      activeBreak,
      breakCategories: parsedCategories,
    }, { headers: ESS_CORS_HEADERS });
  } catch (error: any) {
    console.error("[Mobile Break Timer] GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}

/**
 * POST /api/mobile/leave/break
 * Handles REQUEST_BREAK, PAUSE_BREAK, RESUME_BREAK, and END_BREAK actions.
 * Enforces company Wi-Fi network permission.
 */
export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const employee = await resolveEssEmployee(request, body);
    if (!employee) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401, headers: ESS_CORS_HEADERS }
      );
    }

    const { action = "END_BREAK", leaveId, leaveTypeId, reason = "Lunch Break" } = body;
    const ssid = body.ssid || body.wifiSsid;
    const bssid = body.bssid || body.wifiBssid;
    const latitude = body.latitude;
    const longitude = body.longitude;
    const ipAddress = request.headers.get("x-forwarded-for")?.split(',')[0] || request.headers.get("x-real-ip") || '127.0.0.1';

    // Enforce permitted Wi-Fi network validation for break operations
    const validation = await validateAttendanceRequest(
      employee.companyId || "",
      latitude,
      longitude,
      ssid,
      bssid,
      ipAddress,
      false // do not strictly fail on GPS if employee is indoors on authorized Wi-Fi
    );

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        code: "FORBIDDEN_WIFI",
        error: validation.error || "Lunch break operations are only permitted on authorized company Wi-Fi.",
        details: validation.details
      }, { status: 403, headers: ESS_CORS_HEADERS });
    }

    // 1. Action: Pause active break
    if (action === "PAUSE_BREAK") {
      const active = await getActiveBreakForEmployee(employee.id, employee.companyId);
      const targetLeaveId = leaveId || active?.leaveId;

      if (!targetLeaveId) {
        return NextResponse.json(
          { error: "No active break found to pause." },
          { status: 400, headers: ESS_CORS_HEADERS }
        );
      }

      const result = await processBreakPause(targetLeaveId, employee.id, employee.companyId);
      return NextResponse.json({
        ...result,
        success: true,
      }, { headers: ESS_CORS_HEADERS });
    }

    // 2. Action: Resume paused break
    if (action === "RESUME_BREAK") {
      const active = await getActiveBreakForEmployee(employee.id, employee.companyId);
      const targetLeaveId = leaveId || active?.leaveId;

      if (!targetLeaveId) {
        return NextResponse.json(
          { error: "No paused break found to resume." },
          { status: 400, headers: ESS_CORS_HEADERS }
        );
      }

      const result = await processBreakResume(targetLeaveId, employee.id, employee.companyId);
      return NextResponse.json({
        ...result,
        success: true,
      }, { headers: ESS_CORS_HEADERS });
    }

    // 3. Action: End active/paused break
    if (action === "END_BREAK") {
      const active = await getActiveBreakForEmployee(employee.id, employee.companyId);
      const targetLeaveId = leaveId || active?.leaveId;

      if (!targetLeaveId) {
        return NextResponse.json(
          { error: "No active break request found to end." },
          { status: 400, headers: ESS_CORS_HEADERS }
        );
      }

      const result = await processBreakEnd(targetLeaveId, employee.id, employee.companyId);
      return NextResponse.json({
        ...result,
        message: result.fineApplied
          ? `Break ended. Overstayed by ${result.overstayMinutes}m. A fine of ৳${result.fineAmount} has been registered.`
          : "Break completed successfully within the allocated time.",
      }, { headers: ESS_CORS_HEADERS });
    }

    // 4. Action: Start or Resume Lunch/Short Break
    if (action === "REQUEST_BREAK" || action === "START_BREAK") {
      const existingBreak = await getActiveBreakForEmployee(employee.id, employee.companyId);

      // If an existing break for today is paused, clicking start will RESUME it without resetting to start
      if (existingBreak && existingBreak.isPaused) {
        const result = await processBreakResume(existingBreak.leaveId, employee.id, employee.companyId);
        return NextResponse.json({
          ...result,
          success: true,
          hasActiveBreak: true,
        }, { headers: ESS_CORS_HEADERS });
      }

      // If already active and running
      if (existingBreak && !existingBreak.isPaused) {
        return NextResponse.json({
          success: true,
          message: "Lunch break is already in progress.",
          activeBreak: existingBreak,
          hasActiveBreak: true
        }, { headers: ESS_CORS_HEADERS });
      }

      // Otherwise create a fresh break
      let lt: any = null;
      if (leaveTypeId) {
        lt = await prisma.leaveType.findFirst({
          where: { id: leaveTypeId, companyId: employee.companyId || "" }
        });
      } else {
        lt = await prisma.leaveType.findFirst({
          where: {
            companyId: employee.companyId || "",
            OR: [
              { name: { contains: "Lunch", mode: "insensitive" } },
              { name: { contains: "Break", mode: "insensitive" } },
              { description: { contains: "SHORT_BREAK" } },
              { description: { contains: "TIMER_CONFIG" } },
            ]
          }
        });
      }

      const empWithShift = await prisma.employee.findUnique({
        where: { id: employee.id },
        include: { workShift: true },
      });

      const shiftBreakTime = (empWithShift?.workShift?.breakTime && empWithShift.workShift.breakTime > 0)
        ? empWithShift.workShift.breakTime
        : 60;
      const shiftGracePeriod = (empWithShift?.workShift?.gracePeriod && empWithShift.workShift.gracePeriod > 0)
        ? empWithShift.workShift.gracePeriod
        : 15;

      const parsedConfig = lt ? parseLeaveTypeConfig(lt) : {
        breakDurationMinutes: shiftBreakTime,
        gracePeriodMinutes: shiftGracePeriod,
        fineAmount: 50,
        fineType: "FIXED",
        autoFine: true,
        maxPerDay: 2,
      };

      const effectiveDuration = (empWithShift?.workShift?.breakTime && empWithShift.workShift.breakTime > 0)
        ? empWithShift.workShift.breakTime
        : (parsedConfig.breakDurationMinutes || 60);

      const effectiveGrace = (empWithShift?.workShift?.gracePeriod && empWithShift.workShift.gracePeriod > 0)
        ? empWithShift.workShift.gracePeriod
        : (parsedConfig.gracePeriodMinutes || 15);

      const effectiveFine = parsedConfig.fineAmount || 50;
      const effectiveFineType = parsedConfig.fineType || "FIXED";

      const now = new Date();
      const durationMs = effectiveDuration * 60 * 1000;
      const targetEnd = new Date(now.getTime() + durationMs);

      const configStr = JSON.stringify({
        duration: effectiveDuration,
        grace: effectiveGrace,
        fine: effectiveFine,
        fineType: effectiveFineType,
        autoFine: parsedConfig.autoFine !== false,
      });

      const breakName = lt?.name || "Lunch Break";

      const newLeave = await prisma.leaveRequest.create({
        data: {
          companyId: employee.companyId,
          employeeId: employee.id,
          leaveTypeId: lt?.id || null,
          type: breakName,
          startDate: now,
          endDate: targetEnd,
          reason: reason || "Lunch Break",
          status: "APPROVED", // Instant Auto-Approved
          systemSource: "MOBILE",
          comments: `[TIMER_CONFIG:${configStr}] Auto-Approved ${breakName}: ${effectiveDuration} mins (+${effectiveGrace}m grace tolerance). Overstay penalty fine: ৳${effectiveFine}.`
        }
      });

      const activeBreak = await getActiveBreakForEmployee(employee.id, employee.companyId);

      return NextResponse.json({
        success: true,
        message: `${breakName} started successfully (${effectiveDuration} mins countdown + ${effectiveGrace}m grace).`,
        autoApproved: true,
        leave: newLeave,
        activeBreak,
        hasActiveBreak: true
      }, { status: 201, headers: ESS_CORS_HEADERS });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported actions: END_BREAK, REQUEST_BREAK, PAUSE_BREAK, RESUME_BREAK" },
      { status: 400, headers: ESS_CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[Mobile Break Timer] POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
