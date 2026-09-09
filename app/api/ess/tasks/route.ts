import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

/**
 * OPTIONS /api/ess/tasks
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

/**
 * GET /api/ess/tasks
 * Returns tasks assigned to the authenticated employee.
 */
export async function GET(request: Request) {
  try {
    const employee = await resolveEssEmployee(request);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: ESS_CORS_HEADERS });
    }

    const tasks = await prisma.task.findMany({
      where: { assignedToEmployeeId: employee.employeeId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("[ESS] Tasks fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
