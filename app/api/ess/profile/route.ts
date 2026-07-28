import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET /api/ess/profile
 * Returns the authenticated employee's own profile.
 * Used exclusively by the Staff App mobile portal.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, loginType, companyId } = session.user;

    // Resolve employee record
    let employee;
    if (loginType === "EMPLOYEE") {
      // Logged in directly as employee
      employee = await prisma.employee.findFirst({
        where: { id, companyId },
        include: {
          departmentRef: { select: { name: true } },
          designationRef: { select: { name: true } },
          reportingManager: { select: { firstName: true, lastName: true } },
        },
      });
    } else {
      // ADMIN logged in — find linked employee record via userId
      employee = await prisma.employee.findFirst({
        where: { userId: id, companyId },
        include: {
          departmentRef: { select: { name: true } },
          designationRef: { select: { name: true } },
          reportingManager: { select: { firstName: true, lastName: true } },
        },
      });
    }

    if (!employee) {
      return NextResponse.json(
        { error: "No employee record linked to this account." },
        { status: 404 }
      );
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("[ESS] Profile fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
