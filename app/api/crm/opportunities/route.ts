import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { searchOpportunities, createOpportunity } from "@/lib/crm/opportunityService";

export async function GET(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;
    const status = searchParams.get("status") as any || undefined;
    const stageId = searchParams.get("stageId") || undefined;
    const pipelineId = searchParams.get("pipelineId") || undefined;
    const ownerId = searchParams.get("ownerId") || undefined;
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "50");

    const result = await searchOpportunities(companyId, { query, status, stageId, pipelineId, ownerId, skip, take });
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
    const userId = request.headers.get("x-user-id") || "system"; 
    
    const opportunity = await createOpportunity(companyId, userId, data);
    return NextResponse.json(opportunity, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
