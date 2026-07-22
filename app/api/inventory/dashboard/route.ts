import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PRODUCTS"); // Minimal permission to view inventory dashboard
    if (rbacGuard) return rbacGuard;

    // Concurrently fetch KPIs
    const [
      totalProducts,
      totalWarehouses,
      totalAssets,
      stockTransactions,
      recentAudits,
      purchaseOrders
    ] = await Promise.all([
      prisma.product.count({ where: { companyId } }),
      prisma.warehouse.count({ where: { companyId } }),
      prisma.asset.count({ where: { companyId, status: "ACTIVE" } }),
      prisma.stockTransaction.findMany({ 
        where: { companyId }, 
        include: { product: { select: { minStock: true, purchasePrice: true } } }
      }),
      prisma.inventoryAudit.findMany({ 
        where: { companyId }, 
        take: 10, 
        orderBy: { createdAt: 'desc' },
        include: { performedBy: { select: { name: true } } }
      }),
      prisma.purchaseOrder.findMany({ where: { companyId } })
    ]);

    // Calculate aggregated inventory values
    const inventoryValue = stockTransactions.reduce((sum, tx) => sum + (tx.quantity * Number(tx.product.purchasePrice)), 0);
    const purchaseValue = purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount), 0);

    // Calculate current stock levels to find low stock / out of stock
    const stockMap: Record<string, { currentStock: number, minStock: number }> = {};
    stockTransactions.forEach(tx => {
      if (!stockMap[tx.productId]) {
        stockMap[tx.productId] = { currentStock: 0, minStock: tx.product.minStock };
      }
      stockMap[tx.productId].currentStock += tx.quantity;
    });

    let lowStockCount = 0;
    let outOfStockCount = 0;

    Object.values(stockMap).forEach(stock => {
      if (stock.currentStock <= 0) {
        outOfStockCount++;
      } else if (stock.currentStock <= stock.minStock) {
        lowStockCount++;
      }
    });

    return NextResponse.json({ 
      kpis: {
        totalProducts,
        totalWarehouses,
        totalAssets,
        lowStockCount,
        outOfStockCount,
        inventoryValue,
        purchaseValue
      },
      recentTransactions: recentAudits
    });
  } catch (error) {
    console.error("GET Inventory Dashboard Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
