import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const resolvedParams = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const member = await prisma.member.findFirst({
      where: { id: resolvedParams.id, companyId },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const advances = await prisma.advance.findMany({
      where: { memberId: resolvedParams.id, companyId },
      orderBy: { createdAt: 'desc' }
    });
    
    const advanceBalance = advances.reduce((sum, adv) => sum + Number(adv.remainingAmount), 0);

    // Compute Settlement Share based on Member Role
    const settlements = await prisma.settlement.findMany({
      where: { companyId }
    });

    let totalSettlementEarned = 0;
    const role = member.role.toLowerCase();

    settlements.forEach(s => {
      if (role.includes('ceo') || role.includes('founder')) {
        totalSettlementEarned += Number(s.ceoShare || 0);
      } else if (role.includes('dev') || role.includes('engineer') || role.includes('programmer')) {
        totalSettlementEarned += Number(s.developerShare || 0);
      } else if (role.includes('advisor') || role.includes('consultant')) {
        totalSettlementEarned += Number(s.advisorShare || 0);
      } else if (role.includes('company') || member.name.toLowerCase().includes('company')) {
        totalSettlementEarned += Number(s.companyShare || 0);
      }
    });

    const realSettlementBalance = totalSettlementEarned - advanceBalance;

    return NextResponse.json({ 
      ...member, 
      advances, 
      advanceBalance, 
      totalSettlementEarned, 
      realSettlementBalance 
    });
  } catch (error) {
    console.error('Failed to fetch member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const resolvedParams = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const data = await req.json();

    const member = await prisma.member.update({
      where: { id: resolvedParams.id, companyId },
      data: {
        name: data.name,
        role: data.role,
        email: data.email || null,
        phone: data.phone || null,
        status: data.status,
        joinedAt: data.joinedAt ? new Date(data.joinedAt) : undefined,
      }
    });

    return NextResponse.json(member);
  } catch (error: any) {
    console.error('Failed to update member:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A member with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const resolvedParams = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    await prisma.member.delete({
      where: { id: resolvedParams.id, companyId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Failed to delete member:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
