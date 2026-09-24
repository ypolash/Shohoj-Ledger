import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getFollowUpById, updateFollowUp, deleteFollowUp } from "@/lib/crm/followUpService";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const followUp = await getFollowUpById(companyId, params.id);

    if (!followUp) {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
    }

    return NextResponse.json(followUp);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const data = await request.json();

    const updated = await updateFollowUp(companyId, params.id, data);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error in PATCH /api/crm/follow-ups/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const result = await deleteFollowUp(companyId, params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in DELETE /api/crm/follow-ups/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
