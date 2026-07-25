import { verifyOwnership } from "@/lib/company/verifyOwnership";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireModule } from "@/lib/modules/moduleGuard";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("LEAD_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "LEAD_MANAGEMENT");
  if (moduleGuard) return moduleGuard;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, nextFollowUp, notes, lostReason, assignedTo } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (nextFollowUp !== undefined) data.nextFollowUp = nextFollowUp ? new Date(nextFollowUp) : null;
    if (notes !== undefined) data.notes = notes;
    if (lostReason !== undefined) data.lostReason = lostReason;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;

    if (assignedTo !== undefined && assignedTo !== null) {
      const targetUser = await prisma.user.findFirst({
        where: { id: assignedTo, companyId: companyIdForGuard }
      });
      if (!targetUser) return NextResponse.json({ success: false, message: "Assigned user not found or access denied" }, { status: 403 });
    }

    const existingLead = await prisma.lead.findFirst({
      where: { id, companyId: companyIdForGuard }
    });
    if (!existingLead) return NextResponse.json({ success: false, message: "Lead not found" }, { status: 404 });

    const updatedLead = await prisma.lead.update({
      where: { id },
      data
    });

    return NextResponse.json({ success: true, data: updatedLead });
  } catch (error: any) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("LEAD_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "LEAD_MANAGEMENT");
  if (moduleGuard) return moduleGuard;

  try {
    const { id } = await params;
    const existingLead = await prisma.lead.findFirst({
      where: { id, companyId: companyIdForGuard }
    });
    if (!existingLead) return NextResponse.json({ success: false, message: "Lead not found" }, { status: 404 });

    await prisma.lead.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
