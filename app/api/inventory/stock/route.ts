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

    const rbacGuard = await requirePermission("MANAGE_STOCK");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { warehouseId, productId, type, quantity, reference, notes, toWarehouseId } = body;
    // type can be OPENING, IN, OUT, ADJUSTMENT, DAMAGE, RETURN, TRANSFER
    // quantity should be passed as absolute value by client, we apply the sign here

    if (!warehouseId || !productId || !type || !quantity) {
      return NextResponse.json({ error: "Warehouse, Product, Type, and Quantity are required" }, { status: 400 });
    }

    if (type === "TRANSFER" && !toWarehouseId) {
      return NextResponse.json({ error: "Destination warehouse required for transfer" }, { status: 400 });
    }

    const absoluteQty = Math.abs(Number(quantity));
    let signedQty = 0;
    
    if (["IN", "OPENING", "RETURN"].includes(type)) {
      signedQty = absoluteQty;
    } else if (["OUT", "DAMAGE"].includes(type)) {
      signedQty = -absoluteQty;
    } else if (type === "ADJUSTMENT") {
      signedQty = Number(quantity); // Can be positive or negative from client
    }

    await prisma.$transaction(async (tx) => {
      if (type === "TRANSFER") {
        // Deduct from source
        await tx.stockTransaction.create({
          data: {
            companyId,
            warehouseId,
            productId,
            type: "TRANSFER",
            quantity: -absoluteQty,
            reference,
            notes: notes || `Transfer to warehouse ${toWarehouseId}`,
            performedById: session.user.id
          }
        });
        // Add to destination
        await tx.stockTransaction.create({
          data: {
            companyId,
            warehouseId: toWarehouseId,
            productId,
            type: "TRANSFER",
            quantity: absoluteQty,
            reference,
            notes: notes || `Transfer from warehouse ${warehouseId}`,
            performedById: session.user.id
          }
        });

        await tx.inventoryAudit.create({
          data: {
            companyId,
            action: "WAREHOUSE_TRANSFER",
            entityType: "STOCK",
            entityId: productId,
            description: `Transferred ${absoluteQty} units from W-${warehouseId} to W-${toWarehouseId}`,
            performedById: session.user.id
          }
        });
      } else {
        await tx.stockTransaction.create({
          data: {
            companyId,
            warehouseId,
            productId,
            type,
            quantity: signedQty,
            reference,
            notes,
            performedById: session.user.id
          }
        });

        await tx.inventoryAudit.create({
          data: {
            companyId,
            action: "STOCK_CHANGED",
            entityType: "STOCK",
            entityId: productId,
            description: `${type} ${signedQty} units in W-${warehouseId}`,
            performedById: session.user.id
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Stock Transaction Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
