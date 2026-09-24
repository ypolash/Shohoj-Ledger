import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getFollowUpStats } from "@/lib/crm/followUpService";

export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stats = await getFollowUpStats(companyId);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
