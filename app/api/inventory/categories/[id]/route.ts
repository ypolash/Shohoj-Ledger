import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const category = await prisma.productCategory.findFirst({
      where: { id, companyId, systemSource },
      include: {
        _count: { select: { products: true, children: true } },
        parent: { select: { name: true } },
        children: true
      }
    });

    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json({ category });
  } catch (error) {
    console.error("GET Category Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("CREATE_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { name, description, parentId } = body;

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const existing = await prisma.productCategory.findFirst({
      where: { id, companyId, systemSource }
    });

    if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const updated = await prisma.productCategory.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        description: description !== undefined ? description : existing.description,
        parentId: parentId !== undefined ? (parentId || null) : existing.parentId
      }
    });

    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error("PUT Category Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("DELETE_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const existing = await prisma.productCategory.findFirst({
      where: { id, companyId, systemSource }
    });

    if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    await prisma.productCategory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Category Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
