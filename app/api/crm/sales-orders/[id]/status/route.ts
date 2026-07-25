import { NextRequest, NextResponse } from "next/server";
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.headers.get("x-company-id");
    const userId = req.headers.get("x-user-id");
    if (!companyId || !userId) return NextResponse.json({ error: "Missing headers" }, { status: 400 });

    const { action } = await req.json();
    let result;

    switch (action) {
      case "SUBMIT_APPROVAL":
        const so = await prisma.salesOrder.findFirst({ where: { id: params.id, companyId } });
        if (!so || so.status !== "DRAFT") throw new Error("Can only submit DRAFT orders");
        result = await prisma.salesOrder.update({
          where: { id: params.id },
          data: { status: "PENDING_APPROVAL" }
        });
        await logAudit({ module: "CRM", entityType: "SalesOrder", entityId: params.id, action: "UPDATE", description: `Submitted Sales Order ${result.salesOrderNumber} for approval` });
        break;
      case "APPROVE":
        result = await approveSalesOrder(companyId, params.id, userId);
        break;
      case "RESERVE":
        result = await reserveInventory(companyId, params.id, userId);
        break;
      case "RELEASE":
        result = await releaseReservation(companyId, params.id, userId);
        break;
      case "CANCEL":
        result = await cancelSalesOrder(companyId, params.id, userId);
        break;
      case "CLOSE":
        result = await closeSalesOrder(companyId, params.id, userId);
        break;
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
