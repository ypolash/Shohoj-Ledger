import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stages = await prisma.opportunityStage.findMany({
      where: { companyId },
      orderBy: { displayOrder: 'asc' }
    });
    return NextResponse.json(stages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    
    const stage = await prisma.opportunityStage.create({
      data: {
        ...data,
        companyId,
      }
    });
    return NextResponse.json(stage, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
