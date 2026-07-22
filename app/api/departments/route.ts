import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";

export async function GET() {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const departments = await prisma.department.findMany({
      where: await withCompany(),
      orderBy: { name: 'asc' },
      include: {
        head: {
          select: { id: true, firstName: true, lastName: true }
        },
        _count: {
          select: { employees: true }
        }
      }
    });
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const companyId = await getCompanyId();

    const department = await prisma.department.create({
      data: {
        companyId,
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        headId: data.headId || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create department:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Department with this name or code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
