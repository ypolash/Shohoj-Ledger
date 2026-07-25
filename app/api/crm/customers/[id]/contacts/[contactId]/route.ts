import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { customerContactService } from "@/lib/crm/customerContactService";

export async function PUT(request: Request, { params }: { params: { contactId: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const contact = await customerContactService.updateContact(companyId, params.contactId, data);
    return NextResponse.json(contact);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { contactId: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await customerContactService.removeContact(companyId, params.contactId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
