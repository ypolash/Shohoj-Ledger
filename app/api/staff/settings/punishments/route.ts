import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const companyId = await getCompanyId();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    let whereClause: any = {
      OR: [
        { companyId },
        { companyId: null }
      ]
    };
    if (type) {
      whereClause.type = type;
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
  if (rbacGuard) {
    const attGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (attGuard) return rbacGuard;
  }

  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized: Company context required" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.type) {
      return NextResponse.json({ error: "Violation category is required" }, { status: 400 });
    }

    const newSetting = await prisma.punishmentSetting.create({
      data: {
        companyId,
        type: body.type,
        fromMinutes: Number(body.fromMinutes) || 0,
        toMinutes: Number(body.toMinutes) || 0,
        amount: Number(body.amount) || 0,
        active: body.active !== undefined ? Boolean(body.active) : true
      }
    });
    return NextResponse.json(newSetting);
  } catch (error: any) {
    console.error("Failed to create punishment slab:", error);
    return NextResponse.json({ error: error.message || "Failed to create punishment slab" }, { status: 500 });
  }
}
