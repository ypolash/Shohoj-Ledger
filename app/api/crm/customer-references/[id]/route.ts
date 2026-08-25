import { NextRequest, NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

function getRefModel() {
  return (prisma as any).customerReference || new PrismaClient().customerReference;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const body = await req.json();
    const { referenceText, discountAmount, description } = body;

    const model = getRefModel();
    const existing = await model.findFirst({
      where: { id: resolvedParams.id, companyId }
    });
    if (!existing) return NextResponse.json({ error: "Reference not found" }, { status: 404 });

    const updated = await model.update({
      where: { id: resolvedParams.id },
      data: {
        referenceText: referenceText !== undefined ? referenceText.trim() : existing.referenceText,
        discountAmount: discountAmount !== undefined ? Number(discountAmount) : existing.discountAmount,
        description: description !== undefined ? description : existing.description
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    const resolvedParams = await params;
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const model = getRefModel();
    const existing = await model.findFirst({
      where: { id: resolvedParams.id, companyId }
    });
    if (!existing) return NextResponse.json({ error: "Reference not found" }, { status: 404 });

    await model.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ success: true, message: "Reference deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
