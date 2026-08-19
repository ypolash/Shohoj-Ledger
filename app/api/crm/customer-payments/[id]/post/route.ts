import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { postPayment } from "@/lib/crm/customerPaymentService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId || !companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payment = await postPayment(companyId, resolvedParams.id, userId);
    return NextResponse.json(payment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
