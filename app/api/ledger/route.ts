import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules/moduleGuard";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(request: Request) {
  const rbacGuard = await requirePermission("FINANCE_VIEW");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ACCOUNTING");
  if (moduleGuard) return moduleGuard;

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const moduleFilter = url.searchParams.get("module") || "ALL";

    let whereClause: any = { ...(await withCompany()) };

    if (moduleFilter !== "ALL") {
      whereClause.module = moduleFilter;
    }

    if (search) {
      whereClause.OR = [
        { voucherNo: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const entries = await prisma.ledgerEntry.findMany({
      where: whereClause,
      include: { createdBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching ledger entries:", error);
    return NextResponse.json({ error: "Failed to fetch ledger entries" }, { status: 500 });
  }
}
