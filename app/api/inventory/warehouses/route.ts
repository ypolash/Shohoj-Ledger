import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId, getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_STOCK");
    if (rbacGuard) return rbacGuard;

    const warehouses = await prisma.warehouse.findMany({
      where: { companyId },
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

    const existing = await prisma.warehouse.findFirst({
      where: { companyId, code }
    });
    if (existing) return NextResponse.json({ error: "Warehouse with this code already exists" }, { status: 400 });

    const warehouse = await prisma.warehouse.create({
      data: {
        companyId,
        code,
        name,
        location,
        managerId: managerId || null,
        status: status || "ACTIVE"
      }
    });

    return NextResponse.json({ warehouse });
  } catch (error) {
    console.error("POST Warehouse Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
