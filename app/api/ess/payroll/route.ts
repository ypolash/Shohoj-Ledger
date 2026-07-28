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
 * GET /api/ess/payroll
 * Returns the authenticated employee's own payslips, bonuses, and deductions.
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

    const { companyId, id: employeeId } = employee;

    const [payslips, payments, bonuses, deductions] = await Promise.all([
      prisma.payslip.findMany({
        where: { companyId, employeeId },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),
      prisma.salaryPayment.findMany({
        where: { companyId, employeeId },
        orderBy: { paymentDate: "desc" },
        take: 12,
      }),
      prisma.bonus.findMany({
        where: { companyId, employeeId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.salaryDeduction.findMany({
        where: { companyId, employeeId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({ payslips, payments, bonuses, deductions });
  } catch (error) {
    console.error("[ESS] Payroll fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
