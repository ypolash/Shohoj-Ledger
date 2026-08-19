import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { prisma } from "@/lib/prisma";
import { createPayment } from "@/lib/crm/customerPaymentService";

export async function GET(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const payments = await prisma.customerPayment.findMany({
      where: { companyId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ data: payments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId || !companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payment = await createPayment(companyId, userId, body);
    return NextResponse.json(payment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
