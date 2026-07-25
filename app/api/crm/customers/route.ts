import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { searchCustomers, createCustomer } from "@/lib/crm/customerService";

export async function GET(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;
    const status = searchParams.get("status") as any || undefined;
    const groupId = searchParams.get("groupId") || undefined;
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "50");

    const result = await searchCustomers(companyId, { query, status, groupId, skip, take });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    // Use a placeholder userId for now (in a real app, from session)
    const userId = request.headers.get("x-user-id") || "system"; 
    
    const customer = await createCustomer(companyId, userId, data);
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
