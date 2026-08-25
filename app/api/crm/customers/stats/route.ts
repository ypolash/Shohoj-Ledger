import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_CUSTOMERS");
    if (rbacGuard) return rbacGuard;

    const [total, active, creditAgg, salesAgg] = await Promise.all([
      prisma.customer.count({ where: { companyId } }),
      prisma.customer.count({ where: { companyId, status: "ACTIVE" } }),
      prisma.customer.aggregate({
        _sum: { creditLimit: true },
        where: { companyId }
      }),
      prisma.salesOrder.aggregate({
        _sum: { totalAmount: true },
        where: {
          companyId,
          status: { not: "CANCELLED" },
          orderDate: {
            gte: new Date(new Date().getFullYear(), 0, 1),
            lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999)
          }
        }
      })
    ]);

    return NextResponse.json({
      total,
      active,
      outstanding: Number(creditAgg._sum.creditLimit || 0),
      salesTotal: Number(salesAgg._sum.totalAmount || 0)
    });
  } catch (error: any) {
    console.error("GET Customer Stats Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
