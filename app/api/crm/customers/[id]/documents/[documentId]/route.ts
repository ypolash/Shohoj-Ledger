import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";

export async function DELETE(request: Request, context: { params: Promise<{ id: string, documentId: string }> }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const params = await context.params;

    await prisma.customerDocument.delete({
      where: { 
        id: params.documentId,
        companyId,
        customerId: params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Customer Document Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
