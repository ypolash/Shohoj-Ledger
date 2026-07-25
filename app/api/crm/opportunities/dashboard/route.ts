import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getOpportunityDashboard } from "@/lib/crm/opportunityService";

export async function GET(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dashboard = await getOpportunityDashboard(companyId);
    return NextResponse.json(dashboard);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
