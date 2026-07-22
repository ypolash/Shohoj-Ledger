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

    const where: any = { companyId };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        stockTransactions: {
          select: { quantity: true, type: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate current stock dynamically
    const formattedProducts = products.map(p => {
      let currentStock = 0;
      p.stockTransactions.forEach(t => {
        // IN, OPENING, RETURN add stock. OUT, DAMAGE, TRANSFER (from) deduct.
        // We assume quantity is signed properly or we adjust based on type.
        // Actually, we said "Positive for IN, Negative for OUT/DAMAGE, etc." in schema comments.
        // So we can just sum it up.
        currentStock += t.quantity;
      });
      return {
        ...p,
        currentStock,
        stockTransactions: undefined // Hide heavy transactions from list view
      };
    });

    return NextResponse.json({ products: formattedProducts });
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
      maxStock, reorderLevel, status, notes 
    } = body;

    if (!productCode || !name) {
      return NextResponse.json({ error: "Product Code and Name are required" }, { status: 400 });
    }

    // Check unique constraints
    const existing = await prisma.product.findFirst({
      where: {
        companyId,
        OR: [{ productCode }, { sku: sku || "DUMMY_NEVER_MATCH" }]
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Product with this Code or SKU already exists" }, { status: 400 });
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          companyId,
          productCode,
          barcode,
          sku,
          name,
          description,
          categoryId: categoryId || null,
          brand,
          unit,
          purchasePrice: purchasePrice || 0,
          sellingPrice: sellingPrice || 0,
          minStock: minStock || 0,
          maxStock: maxStock || 0,
          reorderLevel: reorderLevel || 0,
          status: status || "ACTIVE",
          notes
        }
      });

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
  } catch (error) {
    console.error("POST Product Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
