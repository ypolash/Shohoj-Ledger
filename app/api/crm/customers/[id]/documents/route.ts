import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const params = await context.params;

    const documents = await prisma.customerDocument.findMany({
      where: { customerId: params.id, companyId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error("GET Customer Documents Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const params = await context.params;

    const body = await request.json();
    const { title, type, fileUrl } = body;

    if (!title || !type || !fileUrl) {
      return NextResponse.json({ error: "Title, type, and fileUrl are required" }, { status: 400 });
    }

    const document = await prisma.customerDocument.create({
      data: {
        companyId,
        customerId: params.id,
        title,
        type,
        fileUrl
      }
    });

    return NextResponse.json(document);
  } catch (error: any) {
    console.error("POST Customer Document Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
