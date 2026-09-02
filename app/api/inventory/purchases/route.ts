import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/inventory/purchases
 * Retrieves all purchase orders for the active company tenant.
 */
export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const purchases = await prisma.purchaseOrder.findMany({
      where: { companyId },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            contactPerson: true,
            supplierCode: true
          }
        },
        lines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productCode: true,
                sku: true,
                unit: true
              }
            },
            goodsReceiptLines: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ purchases });
  } catch (error: any) {
    if (error.message === "COMPANY_REQUIRED" || error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized or company required" }, { status: 401 });
    }
    console.error("GET Purchases Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/inventory/purchases
 * Creates a new purchase order with subtotal, discount, shipping, and recognized operating expense.
 */
export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_STOCK");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const {
      supplierId,
      poNumber,
      expectedDate,
      supplierRef,
      items,
      notes,
      status,
      discountAmount,
      shippingAmount,
      paymentTerms
    } = body;

    if (!supplierId || !poNumber || !items || !items.length) {
      return NextResponse.json({ error: "Supplier, PO Number, and at least one item are required" }, { status: 400 });
    }

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const calculatedSubtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );

    const discount = Number(discountAmount || 0);
    const shipping = Number(shippingAmount || 0);
    const finalTotal = Math.max(0, calculatedSubtotal - discount + shipping);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create PurchaseOrder
      const po = await tx.purchaseOrder.create({
        data: {
          companyId,
          supplierId,
          purchaseOrderNumber: poNumber,
          expectedDeliveryDate: expectedDate ? new Date(expectedDate) : null,
          subtotal: calculatedSubtotal,
          discountAmount: discount,
          shippingAmount: shipping,
          totalAmount: finalTotal,
          paymentTerms: paymentTerms || null,
          remarks: notes || (supplierRef ? `Ref: ${supplierRef}` : null),
          status: status || "APPROVED",
          systemSource,
          createdById: session?.user?.id || null,
          lines: {
            create: items.map((item: any) => ({
              productId: item.productId || null,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              lineTotal: Number(item.lineTotal || (Number(item.quantity) * Number(item.unitPrice))),
              remarks: item.remarks || item.productName || null
            }))
          }
        },
        include: {
          lines: { include: { product: true } },
          supplier: true,
          company: true
        }
      });

      // 2. Count Purchase as an Operating Expense (PURCHASE_EXPENSE)
      const expense = await tx.expense.create({
        data: {
          companyId,
          category: "PURCHASE_EXPENSE",
          amount: finalTotal,
          paymentMethod: "CREDIT",
          approvalStatus: "APPROVED",
          description: `Purchase Order: ${poNumber} (${po.supplier?.name || "Supplier"})${discount > 0 ? ` (Discount: ৳${discount})` : ""}`,
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
          debit: finalTotal,
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
          credit: finalTotal,
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
