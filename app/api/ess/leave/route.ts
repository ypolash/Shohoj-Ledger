import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";
import { getActiveBreakForEmployee, parseLeaveTypeConfig } from "@/lib/hr/leaveTimer";

/**
 * OPTIONS /api/ess/leave
 * CORS preflight for mobile HTTP clients.
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

/**
 * GET /api/ess/leave
 * Returns the authenticated employee's own leave requests, balances, and active short break timer.
 */
export async function GET(request: Request) {
  try {
    const employee = await resolveEssEmployee(request);
    if (!employee) {
      console.warn("[ESS] Leave GET: Unauthorized request");
      return NextResponse.json(
        { error: "Unauthorized. Please log in to view leave records." },
        { status: 401, headers: ESS_CORS_HEADERS }
      );
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: { companyId: employee.companyId, employeeId: employee.id },
      orderBy: { createdAt: "desc" },
    });

    const companyId = employee.companyId || "";
    const rawLeaveTypes: any[] = await (prisma.leaveType as any).findMany({
      where: { companyId },
      include: { leavePolicies: true },
      orderBy: { createdAt: "asc" }
    });

    const leaveTypes = rawLeaveTypes.map(parseLeaveTypeConfig);

    // Calculate dynamic balances based on company's active leave policies
    const balances = leaveTypes.map(lt => {
      const policy = lt.leavePolicies?.[0];
      const total = policy ? (policy.maxBalance ? Number(policy.maxBalance) : Number(policy.accrualRate) || 0) : 0;

      const approvedForType = leaves.filter(l =>
        l.status === "APPROVED" &&
        (l.type.toLowerCase() === lt.name.toLowerCase() ||
         l.type.toLowerCase().includes(lt.name.toLowerCase()) ||
         lt.name.toLowerCase().includes(l.type.toLowerCase()))
      );

      const used = approvedForType.reduce((acc, l) => {
        const s = new Date(l.startDate).getTime();
        const e = new Date(l.endDate).getTime();
        const days = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
        return acc + (isNaN(days) ? 1 : days);
      }, 0);

      return {
        id: lt.id,
        name: lt.name,
        isPaid: lt.isPaid,
        quotaModel: lt.quotaModel,
        isShortBreak: lt.isShortBreak,
        breakDurationMinutes: lt.breakDurationMinutes,
        gracePeriodMinutes: lt.gracePeriodMinutes,
        fineAmount: lt.fineAmount,
        fineType: lt.fineType,
        autoFine: lt.autoFine,
        total,
        used,
        remaining: Math.max(0, total - used)
      };
    });

    const activeBreak = await getActiveBreakForEmployee(employee.id, employee.companyId);

    return NextResponse.json({
      success: true,
      leaves,
      balances,
      activeBreak,
      hasActiveBreak: Boolean(activeBreak),
      leaveTypes: leaveTypes.map(lt => ({
        id: lt.id,
        name: lt.name,
        description: lt.displayDescription || lt.description,
        isPaid: lt.isPaid,
        quotaModel: lt.quotaModel,
        isShortBreak: lt.isShortBreak,
        breakDurationMinutes: lt.breakDurationMinutes,
        gracePeriodMinutes: lt.gracePeriodMinutes,
        fineAmount: lt.fineAmount,
        fineType: lt.fineType,
        autoFine: lt.autoFine,
      }))
    }, { headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[ESS] Leave fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}

/**
 * POST /api/ess/leave
 * Apply for leave as the authenticated employee.
 * Body: { type, leaveTypeId?, startDate, endDate, reason, employeeId? }
 */
export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const employee = await resolveEssEmployee(request, body);
    if (!employee) {
      console.warn("[ESS] Leave POST: Unauthorized attempt to apply leave");
      return NextResponse.json(
        { error: "Unauthorized. Please log in to apply for leave." },
        { status: 401, headers: ESS_CORS_HEADERS }
      );
    }

    const { type, leaveTypeId, startDate, endDate, reason } = body;

    if (!type && !leaveTypeId) {
      return NextResponse.json(
        { error: "Missing required fields: type or leaveTypeId" },
        { status: 400, headers: ESS_CORS_HEADERS }
      );
    }

    // Check if leave category is a Short Break (Timer model)
    let targetType: any = null;
    if (leaveTypeId) {
      targetType = await prisma.leaveType.findFirst({
        where: { id: leaveTypeId, companyId: employee.companyId || "" }
      });
    } else if (type) {
      targetType = await prisma.leaveType.findFirst({
        where: { name: type, companyId: employee.companyId || "" }
      });
    }

    const parsedType = targetType ? parseLeaveTypeConfig(targetType) : null;
    const isShortBreak = Boolean(parsedType && (parsedType.isShortBreak || parsedType.quotaModel === "SHORT_BREAK")) ||
                         Boolean(type && type.toLowerCase().includes("break"));

    let finalStartDate = startDate ? new Date(startDate) : new Date();
    let finalEndDate = endDate ? new Date(endDate) : new Date();
    let finalStatus = "PENDING";
    let comments: string | null = null;

    if (isShortBreak) {
      const duration = parsedType?.breakDurationMinutes || 30;
      finalStartDate = new Date();
      finalEndDate = new Date(finalStartDate.getTime() + duration * 60 * 1000);
      finalStatus = "APPROVED"; // Auto-Approved instantly
      comments = `Auto-Approved Short Break: ${duration}m allowed (+${parsedType?.gracePeriodMinutes || 5}m grace). Overstay fine: ৳${parsedType?.fineAmount ?? 50}.`;
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        companyId: employee.companyId,
        employeeId: employee.id,
        leaveTypeId: targetType?.id || null,
        type: targetType?.name || type,
        startDate: finalStartDate,
        endDate: finalEndDate,
        reason: reason || (isShortBreak ? "Short Break Request" : "Leave Request"),
        status: finalStatus,
        comments,
        systemSource: employee.systemSource || "MOBILE",
      },
    });

    const activeBreak = isShortBreak ? await getActiveBreakForEmployee(employee.id, employee.companyId) : null;

    return NextResponse.json({
      success: true,
      autoApproved: isShortBreak,
      leave,
      activeBreak,
      hasActiveBreak: Boolean(activeBreak)
    }, { status: 201, headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[ESS] Leave apply error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}

