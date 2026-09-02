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

    const decodedId = decodeURIComponent(id);
    const searchName = decodedId.replace(/_/g, ' ');
    const nameMatches = [{ name: searchName }, { name: " " + searchName }, { name: searchName + " " }];
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);

    const product = await prisma.product.findFirst({
      where: { 
        companyId, 
        systemSource,
        OR: isUUID ? [{ id: decodedId }, ...nameMatches] : nameMatches
      },
      include: {
        category: { select: { name: true } },
        stockTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50 // limit to last 50 transactions for performance
        }
      }
    });

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const stockAgg = await prisma.stockTransaction.aggregate({
      where: { productId: product.id },
      _sum: { quantity: true }
    });
    const currentStock = stockAgg._sum.quantity || 0;

    const openingTx = await prisma.stockTransaction.findFirst({
      where: { productId: product.id, type: "OPENING" }
    });
    const openingStock = openingTx ? openingTx.quantity : 0;

    return NextResponse.json({ product: { ...product, currentStock, openingStock } });
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
      maxStock, reorderLevel, status, notes, imageUrl, customFields
    } = body;

    const decodedId = decodeURIComponent(id);
    const searchName = decodedId.replace(/_/g, ' ');
    const nameMatches = [{ name: searchName }, { name: " " + searchName }, { name: searchName + " " }];
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);

    const existingProduct = await prisma.product.findFirst({
      where: { 
        companyId, 
        systemSource,
        OR: isUUID ? [{ id: decodedId }, ...nameMatches] : nameMatches
      }
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
          id: { not: existingProduct.id },
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
        where: { id: existingProduct.id },
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
          imageUrl,
          customFields: customFields || {}
        }
      });

      if (body.openingStock !== undefined) {
        const targetOpeningStock = Number(body.openingStock) || 0;
        
        // Find existing OPENING stock transaction for this product
        const existingOpeningTx = await tx.stockTransaction.findFirst({
          where: {
            productId: existingProduct.id,
            type: "OPENING"
          }
        });

        if (existingOpeningTx) {
          if (targetOpeningStock > 0) {
            await tx.stockTransaction.update({
              where: { id: existingOpeningTx.id },
              data: { quantity: targetOpeningStock }
            });
          } else {
            await tx.stockTransaction.delete({
              where: { id: existingOpeningTx.id }
            });
          }
        } else if (targetOpeningStock > 0) {
          let targetWarehouse = await tx.warehouse.findFirst({
            where: { companyId, isDefault: true }
          });
          if (!targetWarehouse) {
            targetWarehouse = await tx.warehouse.findFirst({
              where: { companyId }
            });
          }
          if (!targetWarehouse) {
            targetWarehouse = await tx.warehouse.create({
              data: {
                companyId,
                name: "Main Warehouse",
                code: "WH-MAIN",
                isDefault: true,
                systemSource
              }
            });
          }
          await tx.stockTransaction.create({
            data: {
              companyId,
              warehouseId: targetWarehouse.id,
              productId: existingProduct.id,
              type: "OPENING",
              quantity: targetOpeningStock,
              reference: "Initial Opening Stock",
              performedById: session.user.id
            }
          });
        }
      }

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

    const decodedId = decodeURIComponent(id);
    const searchName = decodedId.replace(/_/g, ' ');
    const nameMatches = [{ name: searchName }, { name: " " + searchName }, { name: searchName + " " }];
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);

    const product = await prisma.product.findFirst({
      where: { 
        companyId, 
        systemSource,
        OR: isUUID ? [{ id: decodedId }, ...nameMatches] : nameMatches
      }
    });

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Ensure we can delete (e.g., no stock transactions)
    // Prisma will throw a foreign key constraint error if we try to delete a product with stock transactions.
    // For safety, we can just delete and let Prisma throw, or check beforehand.
    const transactionsCount = await prisma.stockTransaction.count({
      where: { productId: product.id }
    });

    if (transactionsCount > 0) {
      return NextResponse.json({ error: "Cannot delete product that has stock transactions. Consider setting status to INACTIVE." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id: product.id } });

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
