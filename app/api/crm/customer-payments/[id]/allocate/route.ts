import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { allocatePayment } from "@/lib/crm/customerPaymentService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId || !companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { referenceType, referenceId, amountToAllocate } = body;

    if (!referenceType || !referenceId || !amountToAllocate) {
      return NextResponse.json({ error: "Missing allocation parameters" }, { status: 400 });
    }

    const payment = await allocatePayment(
      companyId,
      resolvedParams.id,
      userId,
      referenceType,
      referenceId,
      Number(amountToAllocate)
    );

    return NextResponse.json(payment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
