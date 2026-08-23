import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const product = await prisma.product.findFirst({
      where: { id, companyId, systemSource },
      include: {
        category: { select: { name: true } }
      }
    });

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("GET Product Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EDIT_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const body = await req.json();
    const { 
      productCode, barcode, sku, name, description, categoryId, 
      brand, unit, purchasePrice, sellingPrice, minStock, 
      maxStock, reorderLevel, status, notes, imageUrl 
    } = body;

    const existingProduct = await prisma.product.findFirst({
      where: { id, companyId, systemSource }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check unique constraints for code/sku if they changed
    if (productCode !== existingProduct.productCode || (sku && sku !== existingProduct.sku)) {
      const duplicate = await prisma.product.findFirst({
        where: {
          companyId,
          systemSource,
          id: { not: id },
          OR: [
            { productCode },
            sku ? { sku } : { id: "never_match" }
          ]
        }
      });
      if (duplicate) {
        return NextResponse.json({ error: "Another product with this Code or SKU already exists" }, { status: 400 });
      }
    }

    if (categoryId) {
      const category = await prisma.productCategory.findFirst({
        where: { id: categoryId, companyId, systemSource }
      });
      if (!category) return NextResponse.json({ error: "Category not found or unauthorized" }, { status: 403 });
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id },
        data: {
          productCode,
          barcode: barcode || null,
          sku: sku || null,
          name,
          description,
          categoryId: categoryId || null,
          brand,
          unit,
          purchasePrice: purchasePrice ? Number(purchasePrice) : 0,
          sellingPrice: sellingPrice ? Number(sellingPrice) : 0,
          minStock: minStock ? parseInt(minStock, 10) : 0,
          maxStock: maxStock ? parseInt(maxStock, 10) : 0,
          reorderLevel: reorderLevel ? parseInt(reorderLevel, 10) : 0,
          status: status || "ACTIVE",
          notes,
          imageUrl
        }
      });

      await tx.inventoryAudit.create({
        data: {
          companyId,
          action: "PRODUCT_UPDATED",
          entityType: "PRODUCT",
          entityId: p.id,
          description: `Updated product: ${name} (${productCode})`,
          performedById: session.user.id
        }
      });

      return p;
    });

    return NextResponse.json({ product: updatedProduct });
  } catch (error: any) {
    console.error("PUT Product Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("DELETE_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const product = await prisma.product.findFirst({
      where: { id, companyId, systemSource }
    });

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Ensure we can delete (e.g., no stock transactions)
    // Prisma will throw a foreign key constraint error if we try to delete a product with stock transactions.
    // For safety, we can just delete and let Prisma throw, or check beforehand.
    const transactionsCount = await prisma.stockTransaction.count({
      where: { productId: id }
    });

    if (transactionsCount > 0) {
      return NextResponse.json({ error: "Cannot delete product that has stock transactions. Consider setting status to INACTIVE." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id } });

      await tx.inventoryAudit.create({
        data: {
          companyId,
          action: "PRODUCT_DELETED",
          entityType: "PRODUCT",
          entityId: id,
          description: `Deleted product: ${product.name} (${product.productCode})`,
          performedById: session.user.id
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Product Error:", error);
    return NextResponse.json({ error: "Failed to delete product. It may be referenced by other records." }, { status: 500 });
  }
}
