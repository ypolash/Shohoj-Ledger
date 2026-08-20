import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { getLead, convertLead } from "@/lib/crm/leadService";
import { createCustomer } from "@/lib/crm/customerService";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    
    if (!companyId || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rbacGuard = await requirePermission("EDIT_LEADS");
    if (rbacGuard) return rbacGuard;

    const lead = await getLead(companyId, params.id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (lead.leadStatus === "CONVERTED") {
      return NextResponse.json({ error: "Lead is already converted" }, { status: 400 });
    }

    // Create the customer first using the Lead's information
    const customerData = {
      name: lead.companyName || lead.contactPerson || "Unknown Company",
      email: lead.email || undefined,
      phone: lead.phone || undefined,
      website: lead.website || undefined,
      billingAddress: lead.address || undefined,
      status: "ACTIVE"
    };

    const newCustomer = await createCustomer(companyId, session.user.id, customerData);

    // Convert the lead by linking it to the newly created customer
    const updatedLead = await convertLead(companyId, params.id, session.user.id, { id: newCustomer.id });

    return NextResponse.json({ lead: updatedLead, customer: newCustomer });
  } catch (error: any) {
    console.error("Convert Lead Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
