import { NextRequest, NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const allocations = await prisma.customerPaymentAllocation.findMany({
      where: {
        referenceType: "SALES_ORDER",
        referenceId: resolvedParams.id,
        customerPayment: {
          companyId
        }
      },
      include: {
        customerPayment: true
      },
      orderBy: { customerPayment: { paymentDate: 'desc' } }
    });

    return NextResponse.json({ data: allocations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
