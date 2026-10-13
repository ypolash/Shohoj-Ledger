import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

/**
 * OPTIONS /api/ess/payroll
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

/**
 * GET /api/ess/payroll
 * Returns the authenticated employee's own payslips, bonuses, and deductions.
 */
export async function GET(request: Request) {
  try {
    const employee = await resolveEssEmployee(request);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: ESS_CORS_HEADERS });
    }

    const { companyId, id: employeeId } = employee;

    const [payslips, payments, bonuses, salaryDeductions, employeeFines] = await Promise.all([
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
      prisma.employeeFine.findMany({
        where: {
          employeeId,
          ...(companyId ? { companyId } : {}),
        },
        orderBy: { date: "desc" },
        take: 20,
      }),
    ]);

    const formattedFines = employeeFines.map((f: any) => ({
      id: f.id,
      amount: Number(f.amount),
      reason: f.reason,
      status: f.status,
      date: f.date ? f.date.toISOString() : null,
      createdAt: f.createdAt ? f.createdAt.toISOString() : null,
    }));

    const mappedFineDeductions = employeeFines.map((f: any) => ({
      id: f.id,
      title: `Disciplinary Fine: ৳${Number(f.amount)}`,
      amount: Number(f.amount),
      reason: `${f.reason} (${f.status})`,
      status: f.status,
      isFine: true,
      createdAt: f.date ? f.date.toISOString() : f.createdAt.toISOString(),
    }));

    const combinedDeductions = [...mappedFineDeductions, ...salaryDeductions];

    return NextResponse.json(
      {
        payslips,
        payments,
        bonuses,
        deductions: combinedDeductions,
        fines: formattedFines,
      },
      { headers: ESS_CORS_HEADERS }
    );
  } catch (error) {
    console.error("[ESS] Payroll fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
