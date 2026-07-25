import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateQuotation, deleteQuotation, getQuotationHistory } from "@/lib/crm/quotationService";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.headers.get("x-company-id");
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const quotation = await prisma.quotation.findFirst({
      where: { id: params.id, companyId },
      include: {
        customer: true,
        opportunity: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        lines: {
          include: {
            product: true
          }
        }
      }
    });

    if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const history = await getQuotationHistory(companyId, params.id);

    return NextResponse.json({ ...quotation, history });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.headers.get("x-company-id");
    const userId = req.headers.get("x-user-id");
    if (!companyId || !userId) return NextResponse.json({ error: "Missing headers" }, { status: 400 });

    const body = await req.json();
    const quotation = await updateQuotation(companyId, params.id, userId, body);

    return NextResponse.json(quotation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.headers.get("x-company-id");
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    await deleteQuotation(companyId, params.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
