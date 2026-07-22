import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId, getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EDIT_LEADS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { type, description, newValue } = body;
    const leadId = params.id;

    if (!type || !description) {
      return NextResponse.json({ error: "Missing type or description" }, { status: 400 });
    }

    // Verify ownership
    const existingLead = await prisma.lead.findFirst({
      where: { id: leadId, companyId }
    });

    if (!existingLead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const activity = await prisma.leadActivity.create({
      data: {
        companyId,
        leadId,
        type, // E.g., FOLLOW_UP_CALL, FOLLOW_UP_MEETING
        description,
        newValue, // Optional date for reminder/task
        performedById: session.user.id
      },
      include: {
        performedBy: { select: { id: true, name: true, image: true } }
      }
    });

    // Optionally update lead's nextFollowUp date if passed in
    if (newValue && (type === "FOLLOW_UP_REMINDER" || type === "FOLLOW_UP_TASK")) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { nextFollowUp: new Date(newValue) }
      });
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("POST Lead Activity Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
