import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
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
    const hasCreditLimit = searchParams.get("hasCreditLimit") || undefined;
    const hasBalance = searchParams.get("hasBalance") || undefined;
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "50");

    const result = await searchCustomers(companyId, { query, status, groupId, hasCreditLimit, hasBalance, skip, take });
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
    const session = await getSession();
    let userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); 
    
    const { prisma } = await import("@/lib/prisma");
    
    // Ensure userId resolves to a valid User.id for relations
    let validUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!validUser) {
      const employee = await prisma.employee.findUnique({ where: { id: userId } });
      if (employee?.userId) {
        validUser = await prisma.user.findUnique({ where: { id: employee.userId } });
        if (validUser) userId = validUser.id;
      }
      
      if (!validUser) {
        const fallbackUser = await prisma.user.findFirst({ where: { companyId } });
        if (fallbackUser) {
          userId = fallbackUser.id;
        } else {
          return NextResponse.json({ error: "No user available to assign creator role." }, { status: 403 });
        }
      }
    }
    
    // Transform UI data to Prisma Customer model
    const customerData: any = {
      name: data.customerName,
      displayName: data.displayName || undefined,
      customerCode: data.customerCode || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      mobile: data.mobile || undefined,
      website: data.website || undefined,
      customerGroupId: data.groupId || undefined,
      creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : 0,
      currency: data.currency || "BDT",
      priceLevel: data.paymentTerms || undefined,
      taxNumber: data.tinNo || data.binNo || undefined,
      tradeLicense: data.registrationNo || undefined,
      notes: data.notes || undefined,
      tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
      contacts: {
        create: {
          name: data.primaryContactPerson || data.customerName,
          email: data.email || undefined,
          phone: data.phone || undefined,
          isPrimary: true,
          companyId
        }
      }
    };
    
    const addressesToCreate = [];
    if (data.billingAddress) {
      addressesToCreate.push({
        type: "BILLING",
        addressLine1: data.billingAddress,
        isDefault: true,
        companyId
      });
    }
    if (data.shippingAddress) {
      addressesToCreate.push({
        type: "SHIPPING",
        addressLine1: data.shippingAddress,
        isDefault: !data.billingAddress,
        companyId
      });
    }
    if (addressesToCreate.length > 0) {
      customerData.addresses = { create: addressesToCreate };
    }
    
    const customer = await createCustomer(companyId, userId, customerData);
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
