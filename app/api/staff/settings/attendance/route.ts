import { verifyOwnership } from "@/lib/company/verifyOwnership";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    let config = await prisma.attendanceConfig.findFirst({ where: { ...(await withCompany()) } });
    if (!config) {
      config = await prisma.attendanceConfig.create({ data: {} });
    }
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const body = await request.json();
    let config = await prisma.attendanceConfig.findFirst({ where: { ...(await withCompany()) } });
    
    if (!config) {
      config = await prisma.attendanceConfig.create({ data: body });
    } else {
      config = await prisma.attendanceConfig.update({
        where: { id: config.id },
        data: {
          gracePeriod: body.gracePeriod,
          shiftStart: body.shiftStart,
          shiftEnd: body.shiftEnd,
          fridayOff: body.fridayOff,
          enablePunishmentDeduction: body.enablePunishmentDeduction
        }
      });
    }
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
