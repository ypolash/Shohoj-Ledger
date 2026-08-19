import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { prisma } from "@/lib/prisma";
import { updateQuotation, deleteQuotation, getQuotationHistory } from "@/lib/crm/quotationService";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const quotation = await prisma.quotation.findFirst({
      where: { id: resolvedParams.id, companyId },
      include: {
        customer: true,
        opportunity: true,
        createdBy: { select: { id: true, name: true } },
        lines: {
          include: {
            product: true
          }
        }
      }
    });

    if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const history = await getQuotationHistory(companyId, resolvedParams.id);

    return NextResponse.json({ ...quotation, history });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!companyId || !userId) return NextResponse.json({ error: "Missing headers" }, { status: 400 });

    const body = await req.json();
    const quotation = await updateQuotation(companyId, resolvedParams.id, userId, body);

    return NextResponse.json(quotation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    await deleteQuotation(companyId, resolvedParams.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
