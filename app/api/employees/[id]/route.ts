import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany } from "@/lib/company/companyFilter";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const data = await request.json();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Validate ownership before update
    const existingEmp = await prisma.employee.findFirst({ where: { id, companyId } });
    if (!existingEmp) {
      return NextResponse.json({ error: "Employee not found or unauthorized" }, { status: 404 });
    }

    // Validate relational IDs if present
    if (data.departmentId) {
      const dept = await prisma.department.findFirst({ where: { id: data.departmentId, companyId } });
      if (!dept) return NextResponse.json({ error: 'Invalid department or cross-tenant reference' }, { status: 403 });
    }
    if (data.designationId) {
      const desig = await prisma.designation.findFirst({ where: { id: data.designationId, companyId } });
      if (!desig) return NextResponse.json({ error: 'Invalid designation or cross-tenant reference' }, { status: 403 });
    }
    if (data.reportingManagerId) {
      const mgr = await prisma.employee.findFirst({ where: { id: data.reportingManagerId, companyId } });
      if (!mgr) return NextResponse.json({ error: 'Invalid manager or cross-tenant reference' }, { status: 403 });
    }

    const employee = await prisma.employee.update({
      where: { id },
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
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}
