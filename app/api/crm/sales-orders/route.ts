import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createSalesOrder } from "@/lib/crm/salesOrderService";
import { SalesOrderStatus } from "@prisma/client";
import { getCompanyId } from "@/lib/company/companyFilter";

export async function GET(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query")?.toLowerCase();
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status") as SalesOrderStatus | null;
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const createdById = searchParams.get("createdById");

    const where: any = { companyId };

    if (query) {
      where.OR = [
        { salesOrderNumber: { contains: query, mode: "insensitive" } },
        { customer: { name: { contains: query, mode: "insensitive" } } }
      ];
    }
    
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (createdById) where.createdById = createdById;
    
    if (fromDate || toDate) {
      where.orderDate = {};
      if (fromDate) where.orderDate.gte = new Date(fromDate);
      if (toDate) where.orderDate.lte = new Date(toDate);
    }

    const data = await prisma.salesOrder.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.headers.get("x-company-id");
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!companyId || !userId) return NextResponse.json({ error: "Missing headers" }, { status: 400 });

    const body = await req.json();

    // TEMPORARY: Inject dummy product/warehouse for MVP if missing
    if (body.lines) {
      const defaultProduct = await prisma.product.findFirst({ where: { companyId } });
      const defaultWarehouse = await prisma.warehouse.findFirst({ where: { companyId } });
      body.lines = body.lines.map((line: any) => ({
        ...line,
        productId: line.productId === 'dummy' || !line.productId ? defaultProduct?.id : line.productId,
        warehouseId: line.warehouseId === 'dummy' || !line.warehouseId ? defaultWarehouse?.id : line.warehouseId,
      }));
    }

    const salesOrder = await createSalesOrder(companyId, userId, body);

    return NextResponse.json(salesOrder, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
