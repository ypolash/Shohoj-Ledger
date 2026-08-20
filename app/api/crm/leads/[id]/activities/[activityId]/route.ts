import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function PATCH(req: Request, context: { params: Promise<{ id: string, activityId: string }> }) {
  const params = await context.params;
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EDIT_LEADS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { description } = body;

    const existingActivity = await prisma.leadActivity.findFirst({
      where: { id: params.activityId, companyId, leadId: params.id }
    });

    if (!existingActivity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

    const activity = await prisma.leadActivity.update({
      where: { id: params.activityId },
      data: { description }
    });

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("PATCH Lead Activity Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string, activityId: string }> }) {
  const params = await context.params;
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EDIT_LEADS");
    if (rbacGuard) return rbacGuard;

    const existingActivity = await prisma.leadActivity.findFirst({
      where: { id: params.activityId, companyId, leadId: params.id }
    });

    if (!existingActivity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

    await prisma.leadActivity.delete({
      where: { id: params.activityId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Lead Activity Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
