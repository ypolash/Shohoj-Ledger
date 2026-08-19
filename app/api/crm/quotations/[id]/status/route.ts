import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { 
  approveQuotation, 
  sendQuotation, 
  acceptQuotation, 
  rejectQuotation, 
  expireQuotation, 
  convertToSalesOrder, 
  duplicateQuotation 
} from "@/lib/crm/quotationService";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!companyId || !userId) return NextResponse.json({ error: "Missing headers" }, { status: 400 });

    const { action } = await req.json();
    let result;

    switch (action) {
      case "APPROVE":
        result = await approveQuotation(companyId, resolvedParams.id, userId);
        break;
      case "SEND":
        result = await sendQuotation(companyId, resolvedParams.id, userId);
        break;
      case "ACCEPT":
        result = await acceptQuotation(companyId, resolvedParams.id, userId);
        break;
      case "REJECT":
        result = await rejectQuotation(companyId, resolvedParams.id, userId);
        break;
      case "EXPIRE":
        result = await expireQuotation(companyId, resolvedParams.id, userId);
        break;
      case "CONVERT":
        result = await convertToSalesOrder(companyId, resolvedParams.id, userId);
        break;
      case "DUPLICATE":
        result = await duplicateQuotation(companyId, resolvedParams.id, userId);
        break;
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
