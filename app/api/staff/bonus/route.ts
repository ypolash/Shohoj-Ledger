import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const bonuses = await prisma.bonus.findMany({
      include: {
        employee: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedBonuses = bonuses.map((b) => ({
      employeeId: b.employee.employeeId,
      employeeName: `${b.employee.firstName} ${b.employee.lastName}`,
      bonusAmount: Number(b.amount),
      bonusReason: b.reason || b.type,
      bonusDate: b.createdAt.toISOString()
    }));

    return NextResponse.json(formattedBonuses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
