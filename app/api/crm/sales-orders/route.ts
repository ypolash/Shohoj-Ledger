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

    const orderIds = data.map((d: any) => d.id);
    const allocations = await prisma.customerPaymentAllocation.findMany({
      where: { referenceType: "SALES_ORDER", referenceId: { in: orderIds } }
    });

    const enrichedData = data.map((order: any) => {
      const orderAllocations = allocations.filter(a => a.referenceId === order.id);
      const amountPaid = orderAllocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
      const grandTotal = Number(order.totalAmount);
      
      let paymentStatus = "Unpaid";
      if (amountPaid > 0) {
        paymentStatus = amountPaid >= grandTotal ? "Paid" : "Partial";
      }

      return {
        ...order,
        amountPaid,
        paymentStatus
      };
    });

    return NextResponse.json({ data: enrichedData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!companyId) return NextResponse.json({ error: "Missing headers" }, { status: 400 });

    const body = await req.json();

    // Auto-provision temporary customer if provided without customerId
    if (!body.customerId && body.temporaryCustomer) {
      const temp = body.temporaryCustomer;
      let existingCust = null;
      if (temp.email) {
        existingCust = await prisma.customer.findFirst({ where: { companyId, email: temp.email } });
      }
      if (!existingCust && temp.phone) {
        existingCust = await prisma.customer.findFirst({ where: { companyId, phone: temp.phone } });
      }

      if (existingCust) {
        body.customerId = existingCust.id;
      } else {
        const tempCustomer = await prisma.customer.create({
          data: {
            companyId,
            customerCode: `CUST-TEMP-${Date.now().toString().slice(-6)}`,
            name: temp.name || "Guest Customer",
            displayName: temp.name || "Guest Customer",
            phone: temp.phone || null,
            email: temp.email || null,
            status: "ACTIVE",
            createdById: userId,
            addresses: temp.address
              ? {
                  create: {
                    addressType: "SHIPPING",
                    addressLine1: temp.address,
                    city: "Dhaka",
                    country: "Bangladesh"
                  }
                }
              : undefined
          }
        });
        body.customerId = tempCustomer.id;
      }
    }

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

    const salesOrder = await createSalesOrder(companyId, userId, body);

    return NextResponse.json(salesOrder, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
