import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { prisma } from "@/lib/prisma";
import { updateSalesOrder, deleteSalesOrder, getSalesOrderHistory } from "@/lib/crm/salesOrderService";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const salesOrder = await prisma.salesOrder.findFirst({
      where: { id: resolvedParams.id, companyId },
      include: {
        customer: true,
        company: true,
        quotation: true,
        createdBy: { select: { id: true, name: true } },
        lines: {
          include: {
            product: true,
            warehouse: true
          }
        },
        deliveryOrders: true
      }
    });

    if (!salesOrder) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const history = await getSalesOrderHistory(companyId, resolvedParams.id);

    const allocations = await prisma.customerPaymentAllocation.findMany({
      where: { referenceType: "SALES_ORDER", referenceId: resolvedParams.id }
    });
    const amountPaid = allocations.reduce((sum, alloc) => sum + Number(alloc.allocatedAmount), 0);
    const grandTotal = Number(salesOrder.totalAmount);
    
    let paymentStatus = "Unpaid";
    if (amountPaid > 0) {
      paymentStatus = amountPaid >= grandTotal ? "Paid" : "Partial";
    }

    return NextResponse.json({ ...salesOrder, history, amountPaid, paymentStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!companyId || !userId) return NextResponse.json({ error: "Missing headers" }, { status: 400 });

    const body = await req.json();

    // TEMPORARY: Inject dummy product/warehouse for MVP if missing
    if (body.lines) {
      let defaultProduct = await prisma.product.findFirst({ where: { companyId } });
      if (!defaultProduct) {
        defaultProduct = await prisma.product.create({
          data: {
            companyId,
            productCode: "DUMMY",
            name: "Dummy Product",
          }
        });
      }
      
      let defaultWarehouse = await prisma.warehouse.findFirst({ where: { companyId } });
      if (!defaultWarehouse) {
        defaultWarehouse = await prisma.warehouse.create({
          data: {
            companyId,
            code: "MAIN",
            name: "Main Warehouse",
          }
        });
      }

      body.lines = body.lines.map((line: any) => ({
        ...line,
        productId: line.productId === 'dummy' || !line.productId ? defaultProduct?.id : line.productId,
        warehouseId: line.warehouseId === 'dummy' || !line.warehouseId ? defaultWarehouse?.id : line.warehouseId,
      }));
    }

    const salesOrder = await updateSalesOrder(companyId, resolvedParams.id, userId, body);

    return NextResponse.json(salesOrder);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    await deleteSalesOrder(companyId, resolvedParams.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
