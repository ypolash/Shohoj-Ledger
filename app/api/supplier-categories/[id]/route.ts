import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";

/**
 * DELETE /api/supplier-categories/[id]
 * Deletes a supplier category. Unassigns suppliers before deleting.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const category = await prisma.supplierCategory.findUnique({ where: { id: params.id } });
    if (!category || category.companyId !== companyId) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Unassign any suppliers in this category before deleting
    await prisma.supplier.updateMany({
      where: { companyId, categoryId: params.id },
      data: { categoryId: null }
    });

    await prisma.supplierCategory.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE SupplierCategory Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/supplier-categories/[id]
 * Updates a supplier category's name or description.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description } = body;

    const category = await prisma.supplierCategory.findUnique({ where: { id: params.id } });
    if (!category || category.companyId !== companyId) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updated = await prisma.supplierCategory.update({
      where: { id: params.id },
      data: {
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {})
      }
    });

    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error("PATCH SupplierCategory Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
