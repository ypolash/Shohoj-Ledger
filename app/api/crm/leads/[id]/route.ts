import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId, getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_LEADS");
    if (rbacGuard) return rbacGuard;

    const lead = await prisma.lead.findFirst({
      where: { id: params.id, companyId },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            performedBy: { select: { id: true, name: true, image: true } }
          }
        }
      }
    });

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("GET Lead Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EDIT_LEADS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const leadId = params.id;

    const existingLead = await prisma.lead.findFirst({
      where: { id: leadId, companyId }
    });

    if (!existingLead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    // Build update data
    const updateData: any = {};
    const activitiesToLog: any[] = [];

    const trackChange = (field: string, newValue: any, oldValue: any, type: string) => {
      if (newValue !== undefined && newValue !== oldValue) {
        updateData[field] = newValue;
        activitiesToLog.push({
          type,
          description: `Changed ${field}`,
          oldValue: String(oldValue || ""),
          newValue: String(newValue || "")
        });
      }
    };

    trackChange("status", body.status, existingLead.status, "STATUS_CHANGE");
    trackChange("assignedToId", body.assignedToId, existingLead.assignedToId, "ASSIGNED");
    
    // Track other regular fields generically under "UPDATED"
    const fieldsToTrack = ["companyName", "contactPerson", "phone", "email", "serviceType", "expectedValue", "leadSource", "priority", "industry", "website", "address", "notes", "lostReason"];
    fieldsToTrack.forEach(f => {
      if (body[f] !== undefined && body[f] !== existingLead[f as keyof typeof existingLead]) {
        updateData[f] = body[f];
        // Only log major updates to reduce noise, or log generically
        if (!activitiesToLog.find(a => a.type === "UPDATED")) {
           activitiesToLog.push({ type: "UPDATED", description: "Lead details updated" });
        }
      }
    });

    if (body.expectedClosingDate !== undefined) {
       const newDate = body.expectedClosingDate ? new Date(body.expectedClosingDate) : null;
       updateData.expectedClosingDate = newDate;
    }
    
    if (body.tags !== undefined) {
      updateData.tags = body.tags;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No changes detected", lead: existingLead });
    }

    // Assign activity actor
    activitiesToLog.forEach(a => {
      a.companyId = companyId;
      a.leadId = leadId;
      a.performedById = session.user.id;
    });

    const updatedLead = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.update({
        where: { id: leadId },
        data: updateData
      });

      if (activitiesToLog.length > 0) {
        await tx.leadActivity.createMany({
          data: activitiesToLog
        });
      }

      return lead;
    });

    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    console.error("PATCH Lead Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("DELETE_LEADS");
    if (rbacGuard) return rbacGuard;

    // Verify ownership
    const existing = await prisma.lead.findFirst({
      where: { id: params.id, companyId }
    });
    if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    await prisma.lead.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Lead Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
