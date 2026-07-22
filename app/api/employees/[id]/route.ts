import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany } from "@/lib/company/companyFilter";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const data = await request.json();
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const employee = await prisma.employee.update({
      where: { ...(await withCompany()), id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        designation: data.designation,
        department: data.department,
        basicSalary: data.basicSalary,
        
        // New organization fields
        departmentId: data.departmentId || null,
        designationId: data.designationId || null,
        reportingManagerId: data.reportingManagerId || null,
        employmentType: data.employmentType || null,
        location: data.location || null,
        shift: data.shift || null,
        employmentStatus: data.employmentStatus || undefined,
      }
    });

    return NextResponse.json(employee);
  } catch (error: any) {
    console.error("Error updating employee:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}
