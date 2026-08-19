import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { customerContactService } from "@/lib/crm/customerContactService";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const contacts = await prisma.customerContact.findMany({
      where: { companyId, customerId: params.id },
      orderBy: { isPrimary: 'desc' }
    });

    return NextResponse.json(contacts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); 
    
    const params = await props.params;

    // Auto-mark as primary if no contacts exist
    const count = await prisma.customerContact.count({ where: { companyId, customerId: params.id }});
    if (count === 0) data.isPrimary = true;

    const contact = await customerContactService.addContact(companyId, userId, params.id, data);
    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
