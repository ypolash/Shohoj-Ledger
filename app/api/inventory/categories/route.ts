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

    const categories = await prisma.productCategory.findMany({
      where: { companyId },
      include: {
        _count: { select: { products: true, children: true } },
        parent: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET Categories Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("CREATE_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { name, description, parentId } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const existing = await prisma.productCategory.findFirst({
      where: { companyId, name }
    });
    if (existing) return NextResponse.json({ error: "Category with this name already exists" }, { status: 400 });

    const category = await prisma.productCategory.create({
      data: {
        companyId,
        name,
        description,
        parentId: parentId || null
      }
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("POST Category Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
