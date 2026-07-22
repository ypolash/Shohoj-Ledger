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
      return NextResponse.json({ error: "Designation ID is required" }, { status: 400 });
    }

    const designation = await prisma.designation.update({
      where: { ...(await withCompany()), id },
      data: {
        name: data.name,
        grade: data.grade || null,
        level: data.level || null,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });

    return NextResponse.json(designation);
  } catch (error: any) {
    console.error("Error updating designation:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Designation not found" }, { status: 404 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Designation with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update designation" }, { status: 500 });
  }
}
