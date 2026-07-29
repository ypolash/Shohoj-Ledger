import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_STOCK");
    if (rbacGuard) return rbacGuard;

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const warehouses = await prisma.warehouse.findMany({
      where: { companyId, systemSource },
      include: {
        manager: { select: { firstName: true, lastName: true } },
        _count: { select: { stockTransactions: true } }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ warehouses });
  } catch (error) {
    console.error("GET Warehouses Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_STOCK");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { code, name, location, managerId, status } = body;

    if (!code || !name) return NextResponse.json({ error: "Code and Name are required" }, { status: 400 });

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const existing = await prisma.warehouse.findFirst({
      where: { companyId, code, systemSource }
    });
    if (existing) return NextResponse.json({ error: "Warehouse with this code already exists" }, { status: 400 });

    if (managerId) {
      const manager = await prisma.employee.findFirst({
        where: { id: managerId, companyId }
      });
      if (!manager) return NextResponse.json({ error: "Manager not found or unauthorized" }, { status: 403 });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        companyId,
        code,
        name,
        location,
        managerId: managerId || null,
        status: status || "ACTIVE",
        systemSource
      }
    });

    return NextResponse.json({ warehouse });
  } catch (error) {
    console.error("POST Warehouse Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
