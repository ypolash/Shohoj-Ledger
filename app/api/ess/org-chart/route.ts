import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * Resolves the current employee's record from session.
 */
async function resolveEmployee(session: any) {
  const { id, loginType, companyId } = session.user;
  if (loginType === "EMPLOYEE") {
    return prisma.employee.findFirst({ where: { id, companyId } });
  }
  return prisma.employee.findFirst({ where: { userId: id, companyId } });
}

/**
 * GET /api/ess/org-chart
 * Returns the company's department/employee hierarchy for the org chart.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await resolveEmployee(session);
    if (!employee) {
      return NextResponse.json({ error: "Employee record not found." }, { status: 404 });
    }

    const companyId = employee.companyId;

    const [departments, employees] = await Promise.all([
      prisma.department.findMany({
        where: { companyId },
        orderBy: { name: "asc" },
      }),
      prisma.employee.findMany({
        where: { companyId, status: "ACTIVE" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          department: true,
          departmentId: true,
          reportingManagerId: true,
        },
        orderBy: { firstName: "asc" },
      }),
    ]);

    return NextResponse.json({ departments, employees, currentEmployeeId: employee.id });
  } catch (error) {
    console.error("[ESS] Org chart fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
