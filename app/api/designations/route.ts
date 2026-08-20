import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";

export async function GET() {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const companyFilter = await withCompany();

    // Auto-seed default designations if none exist for this company
    const count = await prisma.designation.count({ where: companyFilter });
    if (count === 0) {
      const companyId = await getCompanyId();
      if (companyId) {
        const defaultDesignations = [
          { companyId, name: 'Managing Director', grade: 'L1', level: 'Executive', description: 'Chief Executive / Managing Director' },
          { companyId, name: 'General Manager', grade: 'L2', level: 'Management', description: 'General Manager / Head of Operations' },
          { companyId, name: 'Senior Software Engineer', grade: 'L3', level: 'Senior Professional', description: 'Senior Software Engineer' },
          { companyId, name: 'Software Engineer', grade: 'L4', level: 'Professional', description: 'Software Engineer' },
          { companyId, name: 'Sales Executive', grade: 'L5', level: 'Staff', description: 'Sales and Marketing Executive' },
          { companyId, name: 'HR Manager', grade: 'L3', level: 'Management', description: 'Human Resources Manager' }
        ];
        await prisma.designation.createMany({ data: defaultDesignations, skipDuplicates: true });
      }
    }

    const designations = await prisma.designation.findMany({
      where: companyFilter,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });
    return NextResponse.json(designations);
  } catch (error) {
    console.error('Failed to fetch designations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json({ error: 'Designation name is required' }, { status: 400 });
    }

    const companyId = await getCompanyId();

    const designation = await prisma.designation.create({
      data: {
        companyId,
        name: data.name,
        grade: data.grade || null,
        level: data.level || null,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });

    return NextResponse.json(designation, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create designation:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Designation with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create designation' }, { status: 500 });
  }
}
