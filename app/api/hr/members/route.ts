import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";

export async function GET() {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const members = await prisma.member.findMany({
      where: await withCompany(),
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(members);
  } catch (error) {
    console.error('Failed to fetch members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const data = await request.json();
    
    if (!data.name || !data.role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    const companyId = await getCompanyId();

    const member = await prisma.member.create({
      data: {
        companyId,
        name: data.name,
        role: data.role,
        email: data.email || null,
        phone: data.phone || null,
        status: data.status || 'ACTIVE',
        joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
      }
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create member:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A member with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}
