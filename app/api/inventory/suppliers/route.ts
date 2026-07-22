import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId, getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const suppliers = await prisma.supplier.findMany({
      where: { companyId },
      include: {
        _count: { select: { purchaseOrders: true } }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("GET Suppliers Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("CREATE_PRODUCTS"); // Assuming creating suppliers is part of creating products/purchasing
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { name, contactPerson, email, phone, address, paymentTerms, status } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const existing = await prisma.supplier.findFirst({
      where: { companyId, name }
    });
    if (existing) return NextResponse.json({ error: "Supplier with this name already exists" }, { status: 400 });

    const supplier = await prisma.supplier.create({
      data: {
        companyId,
        name,
        contactPerson,
        email,
        phone,
        address,
        paymentTerms,
        status: status || "ACTIVE"
      }
    });

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error("POST Supplier Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
