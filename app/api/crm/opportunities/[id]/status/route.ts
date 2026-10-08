import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { markWon, markLost, archiveOpportunity, restoreOpportunity, moveStage } from "@/lib/crm/opportunityService";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); 
    
    let opportunity;

    switch (data.action) {
      case "WON":
        opportunity = await markWon(companyId, id, userId);
        break;
      case "LOST":
        opportunity = await markLost(companyId, id, userId, data.reason);
        break;
      case "ARCHIVE":
        opportunity = await archiveOpportunity(companyId, id, userId);
        break;
      case "RESTORE":
        opportunity = await restoreOpportunity(companyId, id, userId);
        break;
      case "MOVE_STAGE":
        if (!data.stageId) throw new Error("stageId is required");
        opportunity = await moveStage(companyId, id, userId, data.stageId);
        break;
      default:
        throw new Error("Invalid action");
    }

    return NextResponse.json(opportunity);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
