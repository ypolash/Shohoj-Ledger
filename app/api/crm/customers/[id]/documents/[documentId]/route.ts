import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { customerDocumentService } from "@/lib/crm/customerDocumentService";

export async function DELETE(request: Request, { params }: { params: { documentId: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await customerDocumentService.removeDocument(companyId, params.documentId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
