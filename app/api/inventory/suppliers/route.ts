import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

/**
 * GET /api/inventory/suppliers
 * Supports optional query param: ?categoryId=<id> for filtering by category.
 */
export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const url = new URL(req.url);
    const categoryId = url.searchParams.get("categoryId");

    const suppliers = await prisma.supplier.findMany({
      where: {
        companyId,
        ...(categoryId ? { categoryId } : {})
      },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { purchaseOrders: true } }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("GET Suppliers Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/inventory/suppliers
 * Creates a new supplier. Accepts optional categoryId to classify as product/service vendor.
 */
export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("CREATE_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { name, contactPerson, email, phone, address, paymentTerms, status, categoryId } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });

    const existing = await prisma.supplier.findFirst({ where: { companyId, name: name.trim() } });
    if (existing) return NextResponse.json({ error: "A supplier with this name already exists" }, { status: 400 });

    // Auto-generate a supplier code
    const count = await prisma.supplier.count({ where: { companyId } });
    const supplierCode = `SUP-${String(count + 1).padStart(4, "0")}`;

    const supplier = await prisma.supplier.create({
      data: {
        companyId,
        supplierCode,
        name: name.trim(),
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        paymentTerms: paymentTerms || null,
        status: status || "ACTIVE",
        ...(categoryId ? { categoryId } : {})
      },
      include: { category: { select: { id: true, name: true } } }
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error("POST Supplier Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
