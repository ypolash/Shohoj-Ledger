import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { opportunityPipelineService } from "@/lib/crm/opportunityPipelineService";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const userId = request.headers.get("x-user-id") || "system"; 
    
    const pipeline = await opportunityPipelineService.updatePipeline(companyId, params.id, userId, data);
    return NextResponse.json(pipeline);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await opportunityPipelineService.deletePipeline(companyId, params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
