import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    let whereClause = {};
    if (type) {
      whereClause = { type };
    }
    
    const settings = await prisma.punishmentSetting.findMany({
      where: whereClause,
      orderBy: [
        { type: 'asc' },
        { fromMinutes: 'asc' }
      ]
    });
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const body = await request.json();
    const newSetting = await prisma.punishmentSetting.create({
      data: {
        type: body.type,
        fromMinutes: Number(body.fromMinutes),
        toMinutes: Number(body.toMinutes),
        amount: Number(body.amount),
        active: body.active ?? true
      }
    });
    return NextResponse.json(newSetting);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
