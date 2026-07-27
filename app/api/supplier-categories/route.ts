import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";

/**
 * GET /api/supplier-categories
 * Returns all supplier categories for the current company, with supplier counts.
 */
export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const categories = await prisma.supplierCategory.findMany({
      where: { companyId },
      include: {
        _count: { select: { suppliers: true } }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET SupplierCategories Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/supplier-categories
 * Creates a new supplier category.
 */
export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Category name is required" }, { status: 400 });

    const existing = await prisma.supplierCategory.findUnique({
      where: { companyId_name: { companyId, name: name.trim() } }
    });
    if (existing) return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });

    const category = await prisma.supplierCategory.create({
      data: { companyId, name: name.trim(), description: description?.trim() || null }
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("POST SupplierCategory Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
