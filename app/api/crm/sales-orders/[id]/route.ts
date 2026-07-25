import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateSalesOrder, deleteSalesOrder, getSalesOrderHistory } from "@/lib/crm/salesOrderService";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.headers.get("x-company-id");
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
    const companyId = req.headers.get("x-company-id");
    const userId = req.headers.get("x-user-id");
    if (!companyId || !userId) return NextResponse.json({ error: "Missing headers" }, { status: 400 });

    const body = await req.json();
    const salesOrder = await updateSalesOrder(companyId, params.id, userId, body);

    return NextResponse.json(salesOrder);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.headers.get("x-company-id");
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    await deleteSalesOrder(companyId, params.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
