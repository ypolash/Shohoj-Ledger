import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

/**
 * GET /api/mobile/fines
 * Returns disciplinary fines and penalties for the authenticated employee.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawEmployeeId = searchParams.get("employeeId")?.trim();

    let emp = await resolveEssEmployee(req);

    if (!emp && rawEmployeeId) {
      emp = await prisma.employee.findFirst({
        where: {
          OR: [
            { employeeId: rawEmployeeId },
            { id: rawEmployeeId },
            { email: rawEmployeeId.toLowerCase() },
          ],
        },
      });
    }

    if (!emp) {
      return NextResponse.json(
        { error: "Unauthorized or employee not found" },
        { status: 401, headers: ESS_CORS_HEADERS }
      );
    }

    const employeeFines = await prisma.employeeFine.findMany({
      where: {
        employeeId: emp.id,
        ...(emp.companyId ? { companyId: emp.companyId } : {}),
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    const fines = employeeFines.map((f: any) => ({
      id: f.id,
      amount: Number(f.amount),
      reason: f.reason,
      status: f.status,
      date: f.date ? f.date.toISOString() : null,
      createdAt: f.createdAt ? f.createdAt.toISOString() : null,
      systemSource: f.systemSource,
      appealReason: f.appealReason || null,
    }));

    return NextResponse.json({ fines }, { headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[Mobile Fines] Fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}

/**
 * POST /api/mobile/fines
 * Request consideration / review for a fine.
 * Body: { fineId: string, reason: string, employeeId?: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fineId = body.fineId || body.id;
    const requestReason = (body.reason || body.appealReason || "").trim();
    const rawEmployeeId = (body.employeeId || "").trim();

    if (!fineId || !requestReason) {
      return NextResponse.json(
        { error: "Fine ID and consideration reason are required" },
        { status: 400, headers: ESS_CORS_HEADERS }
      );
    }

    let emp = await resolveEssEmployee(req);
    if (!emp && rawEmployeeId) {
      emp = await prisma.employee.findFirst({
        where: {
          OR: [
            { employeeId: rawEmployeeId },
            { id: rawEmployeeId },
            { email: rawEmployeeId.toLowerCase() },
          ],
        },
      });
    }

    const fine = await prisma.employeeFine.findUnique({
      where: { id: fineId },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeId: true, companyId: true, userId: true }
        }
      }
    });

    if (!fine) {
      return NextResponse.json(
        { error: "Fine not found" },
        { status: 404, headers: ESS_CORS_HEADERS }
      );
    }

    // Verify employee ownership if session/emp was resolved
    if (emp && fine.employeeId !== emp.id && (!fine.employee || fine.employee.employeeId !== emp.employeeId)) {
      return NextResponse.json(
        { error: "Unauthorized access to fine record" },
        { status: 403, headers: ESS_CORS_HEADERS }
      );
    }

    // Update the fine status to CONSIDERATION_REQUESTED
    const updatedFine = await prisma.employeeFine.update({
      where: { id: fineId },
      data: {
        status: "CONSIDERATION_REQUESTED",
        appealReason: requestReason,
      },
    });

    // Two-way sync: If late arrival fine, update matching attendance reviewStatus to TEMPORARY_REVIEW
    if (fine.employeeId && (fine.reason || "").toLowerCase().includes("late")) {
      try {
        const fineDate = new Date(fine.date || fine.createdAt);
        const startOfDay = new Date(fineDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(fineDate);
        endOfDay.setHours(23, 59, 59, 999);

        await prisma.attendance.updateMany({
          where: {
            employeeId: fine.employeeId,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          data: {
            reviewStatus: "TEMPORARY_REVIEW",
          },
        });
      } catch (attErr) {
        console.warn("[Mobile Fines] Attendance review status update notice:", attErr);
      }
    }

    // Notify company admins/HR about the consideration request
    const companyId = fine.companyId || (emp ? emp.companyId : null);
    const targetUserId = fine.employee?.userId || (emp as any)?.userId;
    if (companyId && targetUserId) {
      try {
        const empName = fine.employee ? `${fine.employee.firstName} ${fine.employee.lastName}` : "Staff member";
        await prisma.notification.create({
          data: {
            companyId,
            userId: targetUserId,
            category: "FINE",
            title: `Fine Consideration Request: ৳${Number(fine.amount)}`,
            message: `${empName} requested fine consideration for ৳${Number(fine.amount)}: "${requestReason}"`,
            channel: "IN_APP",
            status: "UNREAD",
            priority: "HIGH",
          },
        });
      } catch (notifErr) {
        console.warn("[Mobile Fines] Notification error:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      fine: {
        id: updatedFine.id,
        amount: Number(updatedFine.amount),
        reason: updatedFine.reason,
        status: updatedFine.status,
        appealReason: updatedFine.appealReason,
        date: updatedFine.date ? updatedFine.date.toISOString() : null,
        createdAt: updatedFine.createdAt ? updatedFine.createdAt.toISOString() : null,
      }
    }, { headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[Mobile Fines] Consideration request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
