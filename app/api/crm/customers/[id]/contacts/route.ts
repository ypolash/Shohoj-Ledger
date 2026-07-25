import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { customerContactService } from "@/lib/crm/customerContactService";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const userId = request.headers.get("x-user-id") || "system"; 
    
    const contact = await customerContactService.addContact(companyId, userId, params.id, data);
    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
