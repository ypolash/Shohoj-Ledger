import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";

export async function GET(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const [
      totalCount,
      draftCount,
      pendingCount,
      approvedCount,
      openCount,
      deliveredCount,
      cancelledCount,
      totalRevenue
    ] = await Promise.all([
      prisma.salesOrder.count({ where: { companyId } }),
      prisma.salesOrder.count({ where: { companyId, status: "DRAFT" } }),
      prisma.salesOrder.count({ where: { companyId, status: "PENDING_APPROVAL" } }),
      prisma.salesOrder.count({ where: { companyId, status: "APPROVED" } }),
      prisma.salesOrder.count({ where: { companyId, status: "OPEN" } }), // Reserved
      prisma.salesOrder.count({ where: { companyId, status: { in: ["PARTIALLY_DELIVERED", "DELIVERED", "CLOSED"] } } }),
      prisma.salesOrder.count({ where: { companyId, status: "CANCELLED" } }),
      prisma.salesOrder.aggregate({
        where: { companyId, status: { notIn: ["DRAFT", "PENDING_APPROVAL", "CANCELLED"] } },
        _sum: { totalAmount: true }
      })
    ]);

    return NextResponse.json({
      totalCount,
      draftCount,
      pendingCount,
      approvedCount,
      openCount,
      deliveredCount,
      cancelledCount,
      revenue: totalRevenue._sum.totalAmount || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
