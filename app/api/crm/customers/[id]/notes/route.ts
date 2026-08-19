import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const params = await context.params;
    const body = await request.json();
    const { notes } = body;

    const customer = await prisma.customer.update({
      where: { id: params.id, companyId },
      data: { notes }
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("PUT Customer Notes Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
