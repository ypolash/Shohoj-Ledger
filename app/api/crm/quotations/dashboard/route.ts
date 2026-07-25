import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get("x-company-id");
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const [
      totalCount,
      draftCount,
      pendingCount,
      approvedCount,
      expiredCount,
      acceptedCount,
      rejectedCount,
      wonRevenue
    ] = await Promise.all([
      prisma.quotation.count({ where: { companyId } }),
      prisma.quotation.count({ where: { companyId, status: "DRAFT" } }),
      prisma.quotation.count({ where: { companyId, status: "PENDING_APPROVAL" } }),
      prisma.quotation.count({ where: { companyId, status: "APPROVED" } }),
      prisma.quotation.count({ where: { companyId, status: "EXPIRED" } }),
      prisma.quotation.count({ where: { companyId, status: "ACCEPTED" } }),
      prisma.quotation.count({ where: { companyId, status: "REJECTED" } }),
      prisma.quotation.aggregate({
        where: { companyId, status: "ACCEPTED" },
        _sum: { totalAmount: true }
      })
    ]);

    const conversionRate = totalCount > 0 ? ((acceptedCount / totalCount) * 100).toFixed(2) : 0;

    return NextResponse.json({
      totalCount,
      draftCount,
      pendingCount,
      approvedCount,
      expiredCount,
      acceptedCount,
      rejectedCount,
      revenue: wonRevenue._sum.totalAmount || 0,
      conversionRate
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
