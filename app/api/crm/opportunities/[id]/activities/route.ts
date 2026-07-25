import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { addActivity } from "@/lib/crm/opportunityService";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const opportunity = await prisma.opportunity.findFirst({
      where: { id: params.id, companyId },
      include: {
        activities: {
          orderBy: { activityDate: 'desc' }
        }
      }
    });

    if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(opportunity.activities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const opportunity = await prisma.opportunity.findFirst({
      where: { id: params.id, companyId }
    });

    if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = await request.json();
    const userId = request.headers.get("x-user-id") || "system"; 
    
    const activity = await addActivity(
      companyId,
      userId,
      params.id,
      data.activityType,
      data.subject,
      data.description,
      data.attachments
    );
    
    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
