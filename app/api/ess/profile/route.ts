import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

/**
 * OPTIONS /api/ess/profile
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

/**
 * GET /api/ess/profile
 * Returns the authenticated employee's own profile.
 * Used exclusively by the Staff App mobile portal.
 */
export async function GET(request: Request) {
  try {
    const rawEmployee = await resolveEssEmployee(request);
    if (!rawEmployee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: ESS_CORS_HEADERS });
    }

    const employee = await prisma.employee.findFirst({
      where: { id: rawEmployee.id },
      include: {
        departmentRef: { select: { name: true } },
        designationRef: { select: { name: true } },
        reportingManager: { select: { firstName: true, lastName: true } },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "No employee record linked to this account." },
        { status: 404, headers: ESS_CORS_HEADERS }
      );
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("[ESS] Profile fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
