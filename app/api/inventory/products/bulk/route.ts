import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("CREATE_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No products provided" }, { status: 400 });
    }

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    // Pre-processing and validation
    const productCodes = products.map((p: any) => p.productCode).filter(Boolean);
    const skus = products.map((p: any) => p.sku).filter(Boolean);
    
    // Check for duplicates inside the uploaded file itself
    if (new Set(productCodes).size !== productCodes.length) {
      return NextResponse.json({ error: "Duplicate Product Codes found within the uploaded file." }, { status: 400 });
    }
    if (skus.length > 0 && new Set(skus).size !== skus.length) {
      return NextResponse.json({ error: "Duplicate SKUs found within the uploaded file." }, { status: 400 });
    }

    // Check against DB
    const existing = await prisma.product.findMany({
      where: {
        companyId,
        systemSource,
        OR: [
          { productCode: { in: productCodes } },
          ...(skus.length > 0 ? [{ sku: { in: skus } }] : [])
        ]
      },
      select: { productCode: true, sku: true }
    });

    if (existing.length > 0) {
      const existingCodes = existing.map(e => e.productCode || e.sku).join(", ");
      return NextResponse.json({ error: `Upload failed. These products already exist: ${existingCodes}` }, { status: 400 });
    }

    // Pre-fetch all categories for name-to-id mapping
    const dbCategories = await prisma.productCategory.findMany({
      where: { companyId, systemSource }
    });
    
    const categoryMap = new Map();
    dbCategories.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id));

    const insertedCount = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const p of products) {
        if (!p.name || !p.productCode) continue;

        let categoryId = p.categoryId;
        if (!categoryId && p.categoryName) {
           categoryId = categoryMap.get(String(p.categoryName).toLowerCase().trim()) || null;
        }

        const newProduct = await tx.product.create({
          data: {
            companyId,
            productCode: p.productCode,
            barcode: p.barcode || null,
            sku: p.sku || null,
            name: p.name,
            description: p.description || null,
            categoryId: categoryId || null,
            brand: p.brand || null,
            unit: p.unit || null,
            purchasePrice: p.purchasePrice ? Number(p.purchasePrice) : 0,
            sellingPrice: p.sellingPrice ? Number(p.sellingPrice) : 0,
            minStock: p.minStock ? parseInt(p.minStock, 10) : 0,
            maxStock: p.maxStock ? parseInt(p.maxStock, 10) : 0,
            reorderLevel: p.reorderLevel ? parseInt(p.reorderLevel, 10) : 0,
            status: p.status || "ACTIVE",
            notes: p.notes || null,
            systemSource
          }
        });

        await tx.inventoryAudit.create({
          data: {
            companyId,
            action: "PRODUCT_CREATED",
            entityType: "PRODUCT",
            entityId: newProduct.id,
            description: `Bulk created product: ${newProduct.name} (${newProduct.productCode})`,
            performedById: session.user.id
          }
        });
        count++;
      }
      return count;
    });

    return NextResponse.json({ success: true, count: insertedCount });
  } catch (error: any) {
    console.error("POST Bulk Products Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
