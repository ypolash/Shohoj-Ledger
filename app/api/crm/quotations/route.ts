import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createQuotation } from "@/lib/crm/quotationService";
import { QuotationStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get("x-company-id");
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query")?.toLowerCase();
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status") as QuotationStatus | null;
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    
    // Check for salesperson in the JSON remarks object (not a direct db field, so we just filter by customerId or query if needed, or by createdById if we mapped SalesPerson to creator)
    const createdById = searchParams.get("createdById");

    const where: any = { companyId };

    if (query) {
      where.OR = [
        { quotationNumber: { contains: query, mode: "insensitive" } },
        { customer: { name: { contains: query, mode: "insensitive" } } }
      ];
    }
    
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (createdById) where.createdById = createdById;
    
    if (fromDate || toDate) {
      where.quotationDate = {};
      if (fromDate) where.quotationDate.gte = new Date(fromDate);
      if (toDate) where.quotationDate.lte = new Date(toDate);
    }

    const data = await prisma.quotation.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.headers.get("x-company-id");
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!companyId || !userId) return NextResponse.json({ error: "Missing headers" }, { status: 400 });

    const body = await req.json();
    const quotation = await createQuotation(companyId, userId, body);

    return NextResponse.json(quotation, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
