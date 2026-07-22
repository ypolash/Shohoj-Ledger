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
      return NextResponse.json({ error: "Department ID is required" }, { status: 400 });
    }

    const department = await prisma.department.update({
      where: { ...(await withCompany()), id },
      data: {
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        headId: data.headId || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });

    return NextResponse.json(department);
  } catch (error: any) {
    console.error("Error updating department:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Department with this name or code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Department ID is required" }, { status: 400 });
    }

    // Instead of actual delete, we can also archive it, but let's follow the standard pattern of Prisma delete if needed, or simply set isActive to false.
    // The requirement says "Archive Department" / "Restore Department".
    // I will implement archive as updating isActive.
    
    return NextResponse.json({ error: "Method not allowed, use PUT to archive/restore" }, { status: 405 });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
