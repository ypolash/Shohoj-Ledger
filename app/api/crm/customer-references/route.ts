import { NextRequest, NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

function getRefModel() {
  return (prisma as any).customerReference || new PrismaClient().customerReference;
}

export async function GET(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const model = getRefModel();
    const references = await model.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: references });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

    const body = await req.json();
    const { referenceText, discountAmount, description } = body;

    if (!referenceText || referenceText.trim() === "") {
      return NextResponse.json({ error: "Reference Text is required" }, { status: 400 });
    }

    const model = getRefModel();
    const reference = await model.create({
      data: {
        companyId,
        referenceText: referenceText.trim(),
        discountAmount: Number(discountAmount || 0),
        description: description || null
      }
    });

    return NextResponse.json({ success: true, data: reference });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
