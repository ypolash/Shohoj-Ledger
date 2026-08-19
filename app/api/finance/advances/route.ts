import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";

export async function GET() {
  const rbacGuard = await requirePermission("FINANCE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const advances = await prisma.advance.findMany({
      where: await withCompany(),
      orderBy: { createdAt: 'desc' },
      // Note: Advance does not have a relation to Member in the Prisma schema explicitly mapped with a field relation name, but let's check.
      // Wait, in schema: memberId is just a String, it's not a foreign key. We'll have to fetch the member separately or use a join if needed.
      // Actually, wait, let me check the schema if there is a member relation.
    });

    // Let's fetch members manually to map them since there is no @relation(fields: [memberId]) on Advance in schema.
    const memberIds = advances.map(a => a.memberId);
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds }, companyId: await getCompanyId() }
    });
    
    const memberMap = new Map(members.map(m => [m.id, m]));

    const mappedAdvances = advances.map(a => ({
      ...a,
      memberName: memberMap.get(a.memberId)?.name || 'Unknown',
      memberRole: memberMap.get(a.memberId)?.role || 'Unknown',
    }));

    return NextResponse.json(mappedAdvances);
  } catch (error) {
    console.error('Failed to fetch advances:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("FINANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const data = await request.json();
    
    if (!data.memberId || !data.amount) {
      return NextResponse.json({ error: 'Member and amount are required' }, { status: 400 });
    }

    const companyId = await getCompanyId();

    const advance = await prisma.advance.create({
      data: {
        companyId,
        memberId: data.memberId,
        amount: parseFloat(data.amount),
        remainingAmount: parseFloat(data.amount), // Initially remaining = full amount
        reason: data.reason || null,
        status: 'ACTIVE',
        createdAt: data.date ? new Date(data.date) : new Date(),
      }
    });

    return NextResponse.json(advance, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create advance:', error);
    return NextResponse.json({ error: 'Failed to create advance' }, { status: 500 });
  }
}
