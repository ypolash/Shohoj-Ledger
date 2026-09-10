import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAdmin, CORS_HEADERS } from "@/lib/auth/mobileAdminGuard";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const guard = await verifyMobileAdmin();
  if (!guard.authorized) return guard.response;

  const { companyId } = guard;

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const status = url.searchParams.get("status")?.trim() || "";

    const where: any = { companyId };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        departmentRef: { select: { id: true, name: true } },
        designationRef: { select: { id: true, name: true } },
        reportingManager: {
          select: { id: true, firstName: true, lastName: true, employeeId: true },
        },
        profile: {
          select: { gender: true, currentAddress: true, mainAddress: true },
        },
        emergencyContacts: {
          select: { name: true, phone: true, relationship: true },
          take: 1,
        },
      },
    });

    const formattedEmployees = employees.map((emp) => ({
      id: emp.id,
      employeeId: emp.employeeId,
      name: `${emp.firstName} ${emp.lastName}`.trim(),
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      designation: emp.designationRef?.name || emp.designation || "Staff",
      department: emp.departmentRef?.name || emp.department || "General",
      status: emp.status,
      basicSalary: emp.basicSalary ? Number(emp.basicSalary) : 0,
      joiningDate: emp.joinDate ? emp.joinDate.toISOString() : null,
      employmentType: emp.employmentType || "FULL_TIME",
      gender: emp.profile?.gender || null,
      address: emp.profile?.currentAddress || emp.profile?.mainAddress || emp.location || null,
      emergencyContact: emp.emergencyContacts?.[0]
        ? `${emp.emergencyContacts[0].name} (${emp.emergencyContacts[0].relationship})`
        : null,
      emergencyPhone: emp.emergencyContacts?.[0]?.phone || null,
      reportingManager: emp.reportingManager
        ? `${emp.reportingManager.firstName} ${emp.reportingManager.lastName}`.trim()
        : null,
      createdAt: emp.createdAt.toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        count: formattedEmployees.length,
        employees: formattedEmployees,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[Mobile Admin Employees] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
