import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

/**
 * OPTIONS /api/mobile/leave
 * CORS preflight for mobile HTTP clients.
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

/**
 * GET /api/mobile/leave
 * Returns leave requests for the employee.
 */
export async function GET(request: Request) {
  try {
    const employee = await resolveEssEmployee(request);
    if (!employee) {
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
    const leaveTypes: any[] = await (prisma.leaveType as any).findMany({
      where: { companyId },
      include: { leavePolicies: true },
      orderBy: { createdAt: "asc" }
    });

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
        total,
        used,
        remaining: Math.max(0, total - used)
      };
    });

    return NextResponse.json({
      success: true,
      leaves,
      balances,
      leaveTypes: leaveTypes.map(lt => ({
        id: lt.id,
        name: lt.name,
        description: lt.description,
        isPaid: lt.isPaid
      }))
    }, { headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[Mobile Leave] fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}

/**
 * POST /api/mobile/leave
 * Apply for leave from mobile staff app.
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
      return NextResponse.json(
        { error: "Unauthorized. Please log in to apply for leave." },
        { status: 401, headers: ESS_CORS_HEADERS }
      );
    }

    const { type, startDate, endDate, reason } = body;

    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: type, startDate, endDate, reason" },
        { status: 400, headers: ESS_CORS_HEADERS }
      );
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        companyId: employee.companyId,
        employeeId: employee.id,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: "PENDING",
        systemSource: employee.systemSource || "MOBILE",
      },
    });

    return NextResponse.json({ success: true, leave }, { status: 201, headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[Mobile Leave] apply error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
