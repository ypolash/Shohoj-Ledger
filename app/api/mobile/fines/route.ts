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
