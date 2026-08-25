import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { prisma } from "@/lib/prisma";
import { convertSalesOrder, shipDelivery } from "@/lib/crm/deliveryOrderService";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const deliveries = await prisma.deliveryOrder.findMany({
      where: { salesOrderId: resolvedParams.id, companyId },
      include: { lines: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: deliveries });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const { carrier, trackingNumber, deliveryDate, remarks } = body;

    // 1. Convert Sales Order into a Delivery Order
    const deliveryOrder = await convertSalesOrder(companyId, resolvedParams.id, userId, {
      carrier: carrier || "Standard Courier",
      trackingNumber: trackingNumber || "",
      deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
      remarks: remarks || "Shipment created from Sales Order Workspace"
    });

    // 2. Ship the Delivery (deducts stock and records stock movement)
    let shippedOrder = deliveryOrder;
    try {
      shippedOrder = await shipDelivery(companyId, deliveryOrder.id, userId) || deliveryOrder;
    } catch (shipErr: any) {
      console.warn("Stock movement note:", shipErr.message);
    }

    // 3. Update Sales Order status to DELIVERED
    await prisma.salesOrder.update({
      where: { id: resolvedParams.id },
      data: { status: "DELIVERED" }
    });

    return NextResponse.json({ success: true, data: shippedOrder });
  } catch (err: any) {
    console.error("Create Delivery Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create shipment" }, { status: 400 });
  }
}
