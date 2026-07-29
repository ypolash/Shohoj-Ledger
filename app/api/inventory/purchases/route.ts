import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const purchases = await prisma.purchaseOrder.findMany({
      where: { companyId, systemSource },
      include: {
        supplier: { select: { name: true } },
        lines: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("GET Purchases Error:", error);
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
    const { supplierId, poNumber, expectedDate, supplierRef, items, notes } = body;

    if (!supplierId || !poNumber || !items || !items.length) {
      return NextResponse.json({ error: "Supplier, PO Number, and Items are required" }, { status: 400 });
    }

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);

    const po = await prisma.purchaseOrder.create({
      data: {
        companyId,
        supplierId,
        purchaseOrderNumber: poNumber,
        expectedDeliveryDate: expectedDate ? new Date(expectedDate) : null,
        supplierRef,
        totalAmount,
        notes,
        status: "DRAFT",
        systemSource,
        lines: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            lineTotal: Number(item.quantity) * Number(item.unitPrice)
          }))
        }
      },
      include: { lines: true }
    });

    return NextResponse.json({ purchase: po });
  } catch (error) {
    console.error("POST Purchase Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
