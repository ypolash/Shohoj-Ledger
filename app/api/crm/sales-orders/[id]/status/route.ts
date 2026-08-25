import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { 
  approveSalesOrder, 
  reserveInventory, 
  releaseReservation,
  cancelSalesOrder, 
  closeSalesOrder 
} from "@/lib/crm/salesOrderService";
import { SalesOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!companyId || !userId) return NextResponse.json({ error: "Missing headers" }, { status: 400 });

    const body = await req.json();
    const { action, status } = body;

    // Allow direct status updates (e.g. from Shipment Status KPI card)
    if (status) {
      const updated = await prisma.salesOrder.update({
        where: { id: resolvedParams.id },
        data: { status: status as SalesOrderStatus }
      });
      await logAudit({
        module: "CRM",
        entityType: "SalesOrder",
        entityId: resolvedParams.id,
        action: "UPDATE",
        description: `Updated Sales Order status to ${status}`
      });
      return NextResponse.json(updated);
    }

    let result;
    switch (action) {
      case "SUBMIT_APPROVAL":
        const so = await prisma.salesOrder.findFirst({ where: { id: resolvedParams.id, companyId } });
        if (!so || so.status !== "DRAFT") throw new Error("Can only submit DRAFT orders");
        result = await prisma.salesOrder.update({
          where: { id: resolvedParams.id },
          data: { status: "PENDING_APPROVAL" }
        });
        await logAudit({ module: "CRM", entityType: "SalesOrder", entityId: resolvedParams.id, action: "UPDATE", description: `Submitted Sales Order ${result.salesOrderNumber} for approval` });
        break;
      case "APPROVE":
        result = await approveSalesOrder(companyId, resolvedParams.id, userId);
        break;
      case "RESERVE":
        result = await reserveInventory(companyId, resolvedParams.id, userId);
        break;
      case "RELEASE":
        result = await releaseReservation(companyId, resolvedParams.id, userId);
        break;
      case "CANCEL":
        result = await cancelSalesOrder(companyId, resolvedParams.id, userId);
        break;
      case "CLOSE":
        result = await closeSalesOrder(companyId, resolvedParams.id, userId);
        break;
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
