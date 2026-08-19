import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getCustomer, updateCustomer, deleteCustomer } from "@/lib/crm/customerService";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customer = await getCustomer(companyId, params.id);
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    
    // Transform UI data to Prisma Customer model
    const customerData: any = {
      name: data.customerName,
      customerCode: data.customerCode || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      customerGroupId: data.groupId || undefined,
      creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : 0,
      currency: data.currency || "BDT",
      priceLevel: data.paymentTerms || undefined,
      taxNumber: data.tinNo || data.binNo || undefined,
      tradeLicense: data.registrationNo || undefined,
      status: data.status || "ACTIVE"
    };

    if (data.primaryContactPerson) {
      customerData.contacts = {
        updateMany: {
          where: { isPrimary: true },
          data: {
            name: data.primaryContactPerson,
            phone: data.phone || undefined,
            email: data.email || undefined
          }
        }
      };
    }

    // Assuming we just update the basic customer record for now.
    // Updating contacts/addresses requires checking existence or creating new ones.
    const customer = await updateCustomer(companyId, params.id, customerData);
    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await deleteCustomer(companyId, params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
