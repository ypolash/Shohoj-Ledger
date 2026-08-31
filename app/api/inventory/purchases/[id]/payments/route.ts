import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

/**
 * GET /api/inventory/purchases/[id]/payments
 * Retrieves all supplier payments and ledger settlements for a given purchase order.
 */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: { supplier: true }
    });

    if (!po || po.companyId !== companyId) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    const ledgerPayments = await prisma.ledgerEntry.findMany({
      where: {
        companyId,
        referenceId: po.id,
        voucherType: "SUPPLIER_PAYMENT"
      },
      orderBy: { date: "desc" }
    });

    return NextResponse.json({
      purchaseOrder: po,
      payments: ledgerPayments
    });
  } catch (error) {
    console.error("GET Purchase Payments Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/inventory/purchases/[id]/payments
 * Records a supplier payment against a purchase order and posts settlement ledger entries.
 */
export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_STOCK");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { amount, paymentMethod, referenceNumber, paymentDate, notes } = body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: { supplier: true }
    });

    if (!po || po.companyId !== companyId) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";
    const paymentNum = `SPAY-${Date.now().toString().slice(-6)}`;
    const effectiveDate = paymentDate ? new Date(paymentDate) : new Date();

    const paymentResult = await prisma.$transaction(async (tx) => {
      // 1. Create SupplierPayment record
      const supplierPay = await tx.supplierPayment.create({
        data: {
          companyId,
          supplierId: po.supplierId,
          paymentNumber: paymentNum,
          paymentDate: effectiveDate,
          paymentMethod: (paymentMethod || "CASH").toUpperCase() as any,
          amount: payAmount,
          allocatedAmount: payAmount,
          unallocatedAmount: 0,
          status: "POSTED",
          referenceNumber: referenceNumber || po.purchaseOrderNumber,
          remarks: notes || `Payment for PO: ${po.purchaseOrderNumber}`,
          createdById: session?.user?.id || null
        }
      });

      // 2. Dual-Entry Ledger: Debit Accounts Payable (reduces liability)
      await tx.ledgerEntry.create({
        data: {
          companyId,
          date: effectiveDate,
          voucherNo: paymentNum,
          voucherType: "SUPPLIER_PAYMENT",
          module: "INVENTORY",
          accountType: "LIABILITY",
          debit: payAmount,
          credit: 0,
          status: "COMPLETED",
          description: `Supplier Payment for PO ${po.purchaseOrderNumber} (${po.supplier.name})`,
          referenceId: po.id,
          referenceType: "PurchaseOrder",
          createdById: session?.user?.id || null,
          systemSource
        }
      });

      // 3. Dual-Entry Ledger: Credit Cash / Bank Account (outflow)
      const creditAccount = (paymentMethod || "").toUpperCase() === "BANK" ? "BANK_ACCOUNT" : "CASH_IN_HAND";
      await tx.ledgerEntry.create({
        data: {
          companyId,
          date: effectiveDate,
          voucherNo: paymentNum,
          voucherType: "SUPPLIER_PAYMENT",
          module: "INVENTORY",
          accountType: "ASSET",
          debit: 0,
          credit: payAmount,
          status: "COMPLETED",
          description: `Disbursed via ${paymentMethod || "Cash"} for PO ${po.purchaseOrderNumber}`,
          referenceId: po.id,
          referenceType: "PurchaseOrder",
          createdById: session?.user?.id || null,
          systemSource
        }
      });

      return supplierPay;
    });

    return NextResponse.json({
      success: true,
      payment: paymentResult,
      message: "Supplier payment recorded and posted to ledger."
    });
  } catch (error: any) {
    console.error("POST Purchase Payment Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
