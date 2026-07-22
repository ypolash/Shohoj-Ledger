import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_AUDIT");
    if (rbacGuard) return rbacGuard;

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const module = url.searchParams.get("module");
    const user = url.searchParams.get("user");
    const action = url.searchParams.get("action");
    const search = url.searchParams.get("search"); // referenceId or description

    const where: any = { companyId };

    if (module) where.module = module;
    if (user) {
      where.user = {
        name: { contains: user, mode: 'insensitive' }
      };
    }
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const total = await prisma.globalAuditLog.count({ where });
    const logs = await prisma.globalAuditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("GET Audit Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
