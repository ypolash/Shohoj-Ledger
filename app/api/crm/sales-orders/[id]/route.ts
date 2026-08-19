import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { prisma } from "@/lib/prisma";
import { updateSalesOrder, deleteSalesOrder, getSalesOrderHistory } from "@/lib/crm/salesOrderService";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const salesOrder = await prisma.salesOrder.findFirst({
      where: { id: params.id, companyId },
      include: {
        customer: true,
        quotation: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        lines: {
          include: {
            product: true,
            warehouse: true
          }
        }
      }
    });

    if (!salesOrder) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const history = await getSalesOrderHistory(companyId, params.id);

    return NextResponse.json({ ...salesOrder, history });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
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

    const salesOrder = await updateSalesOrder(companyId, params.id, userId, body);

    return NextResponse.json(salesOrder);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    await deleteSalesOrder(companyId, params.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
