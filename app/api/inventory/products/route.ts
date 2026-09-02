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

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const categoryId = url.searchParams.get("categoryId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const where: any = { companyId, systemSource };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.product.count({ where });
    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        stockTransactions: {
          select: { quantity: true, type: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate current stock dynamically
    const formattedProducts = products.map(p => {
      let currentStock = 0;
      let openingStock = 0;
      p.stockTransactions.forEach(t => {
        if (t.type === "OPENING") {
          openingStock += t.quantity;
        }
        currentStock += t.quantity;
      });
      return {
        ...p,
        currentStock,
        openingStock,
        stockTransactions: undefined // Hide heavy transactions from list view
      };
    });

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("GET Products Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("CREATE_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { 
      productCode, barcode, sku, name, description, categoryId, 
      brand, unit, purchasePrice, sellingPrice, minStock, 
      maxStock, reorderLevel, status, notes, imageUrl, customFields
    } = body;

    if (!productCode || !name) {
      return NextResponse.json({ error: "Product Code and Name are required" }, { status: 400 });
    }

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    // Check unique constraints
    const existing = await prisma.product.findFirst({
      where: {
        companyId,
        systemSource,
        OR: [{ productCode }, { sku: sku || "DUMMY_NEVER_MATCH" }]
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Product with this Code or SKU already exists" }, { status: 400 });
    }

    if (categoryId) {
      const category = await prisma.productCategory.findFirst({
        where: { id: categoryId, companyId, systemSource }
      });
      if (!category) return NextResponse.json({ error: "Category not found or unauthorized" }, { status: 403 });
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          companyId,
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
          customFields: customFields || {},
          systemSource
        }
      });

      if (body.openingStock && Number(body.openingStock) > 0) {
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
            productId: p.id,
            type: "OPENING",
            quantity: Number(body.openingStock),
            reference: "Initial Opening Stock",
            performedById: session.user.id
          }
        });
      }

      await tx.inventoryAudit.create({
        data: {
          companyId,
          action: "PRODUCT_CREATED",
          entityType: "PRODUCT",
          entityId: p.id,
          description: `Created product: ${name} (${productCode})`,
          performedById: session.user.id
        }
      });

      return p;
    });

    return NextResponse.json({ product: newProduct });
  } catch (error: any) {
    console.error("POST Product Error:", error);
    return NextResponse.json({ error: "Internal server error", details: error?.message || String(error) }, { status: 500 });
  }
}
