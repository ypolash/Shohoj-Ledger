import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { opportunityPipelineService } from "@/lib/crm/opportunityPipelineService";

export async function GET(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pipelines = await opportunityPipelineService.getPipelines(companyId);
    return NextResponse.json(pipelines);
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
    
    const pipeline = await opportunityPipelineService.createPipeline(companyId, userId, data);
    return NextResponse.json(pipeline, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
