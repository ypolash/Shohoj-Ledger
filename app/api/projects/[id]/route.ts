import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId, getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const project = await prisma.project.findFirst({
      where: { id: params.id, companyId },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, companyName: true, contactPerson: true } },
        teamMembers: { select: { id: true, firstName: true, lastName: true, email: true, designation: true } },
        tasks: {
          include: {
            employee: { select: { firstName: true, lastName: true } }
          }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            performedBy: { select: { id: true, name: true, image: true } }
          }
        }
      }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("GET Project Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EDIT_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const projectId = params.id;

    const existingProject = await prisma.project.findFirst({
      where: { id: projectId, companyId },
      include: { teamMembers: true }
    });

    if (!existingProject) return NextResponse.json({ error: "Project not found" }, { status: 404 });

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

    trackChange("status", body.status, existingProject.status, "PROJECT_STATUS");
    trackChange("managerId", body.managerId, existingProject.managerId, "PROJECT_UPDATED");

    const fieldsToTrack = ["name", "description", "category", "priority", "clientName", "leadId", "estimatedBudget", "actualCost", "progress"];
    fieldsToTrack.forEach(f => {
      if (body[f] !== undefined && body[f] !== existingProject[f as keyof typeof existingProject]) {
        updateData[f] = body[f];
        if (!activitiesToLog.find(a => a.type === "PROJECT_UPDATED")) {
           activitiesToLog.push({ type: "PROJECT_UPDATED", description: "Project details updated" });
        }
      }
    });

    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.teamMemberIds !== undefined) {
      updateData.teamMembers = { set: body.teamMemberIds.map((id: string) => ({ id })) };
      activitiesToLog.push({ type: "PROJECT_UPDATED", description: "Team members updated" });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No changes detected", project: existingProject });
    }

    activitiesToLog.forEach(a => {
      a.companyId = companyId;
      a.projectId = projectId;
      a.performedById = session.user.id;
    });

    const updatedProject = await prisma.$transaction(async (tx) => {
      const p = await tx.project.update({
        where: { id: projectId },
        data: updateData
      });

      if (activitiesToLog.length > 0) {
        await tx.projectActivity.createMany({ data: activitiesToLog });
      }

      return p;
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("PATCH Project Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("DELETE_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const existing = await prisma.project.findFirst({
      where: { id: params.id, companyId }
    });
    if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    await prisma.project.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Project Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
