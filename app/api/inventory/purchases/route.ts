import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

/**
 * GET /api/inventory/purchases
 * Retrieves purchase orders for the active tenant.
 */
export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const purchases = await prisma.purchaseOrder.findMany({
      where: { companyId, systemSource },
      include: {
        supplier: { select: { id: true, name: true, phone: true, email: true } },
        lines: {
          include: {
            goodsReceiptLines: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("GET Purchases Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/inventory/purchases
 * Creates a new purchase order, records it as an Operating Expense (PURCHASE_EXPENSE),
 * and creates corresponding dual-entry LedgerEntry records.
 */
export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_STOCK");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { supplierId, poNumber, expectedDate, supplierRef, items, notes, status } = body;

    if (!supplierId || !poNumber || !items || !items.length) {
      return NextResponse.json({ error: "Supplier, PO Number, and at least one item are required" }, { status: 400 });
    }

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create PurchaseOrder
      const po = await tx.purchaseOrder.create({
        data: {
          companyId,
          supplierId,
          purchaseOrderNumber: poNumber,
          expectedDeliveryDate: expectedDate ? new Date(expectedDate) : null,
          totalAmount,
          subtotal: totalAmount,
          remarks: notes || (supplierRef ? `Ref: ${supplierRef}` : null),
          status: status || "APPROVED",
          systemSource,
          createdById: session?.user?.id || null,
          lines: {
            create: items.map((item: any) => ({
              productId: item.productId || null,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              lineTotal: Number(item.quantity) * Number(item.unitPrice),
              remarks: item.remarks || item.productName || null
            }))
          }
        },
        include: { lines: true, supplier: true }
      });

      // 2. Count Purchase as an Operating Expense (PURCHASE_EXPENSE)
      const expense = await tx.expense.create({
        data: {
          companyId,
          category: "PURCHASE_EXPENSE",
          amount: totalAmount,
          paymentMethod: "CREDIT",
          approvalStatus: "APPROVED",
          description: `Purchase Order: ${poNumber} (${po.supplier?.name || "Supplier"})`,
          systemSource
        }
      });

      // 3. Dual-Entry Ledger: Debit Expense (PURCHASE_EXPENSE)
      await tx.ledgerEntry.create({
        data: {
          companyId,
          date: new Date(),
          voucherNo: poNumber,
          voucherType: "PURCHASE",
          module: "INVENTORY",
          accountType: "EXPENSE",
          debit: totalAmount,
          credit: 0,
          status: "COMPLETED",
          description: `Purchase Order Expense: ${poNumber}`,
          referenceId: po.id,
          referenceType: "PurchaseOrder",
          createdById: session?.user?.id || null,
          systemSource
        }
      });

      // 4. Dual-Entry Ledger: Credit Accounts Payable (ACCOUNTS_PAYABLE)
      await tx.ledgerEntry.create({
        data: {
          companyId,
          date: new Date(),
          voucherNo: poNumber,
          voucherType: "PURCHASE",
          module: "INVENTORY",
          accountType: "LIABILITY",
          debit: 0,
          credit: totalAmount,
          status: "COMPLETED",
          description: `Accounts Payable Liability: ${poNumber} - ${po.supplier?.name || "Supplier"}`,
          referenceId: po.id,
          referenceType: "PurchaseOrder",
          createdById: session?.user?.id || null,
          systemSource
        }
      });

      return { po, expense };
    });

    return NextResponse.json({ purchase: result.po, expense: result.expense });
  } catch (error: any) {
    console.error("POST Purchase Error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A purchase order with this PO number already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
