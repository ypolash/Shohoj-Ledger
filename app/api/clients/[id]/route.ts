import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_CLIENTS");
    if (rbacGuard) return rbacGuard;

    const client = await prisma.client.findFirst({
      where: { id: params.id, companyId },
      include: {
        contacts: { orderBy: { createdAt: 'asc' } },
        documents: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
        projects: {
          select: { id: true, name: true, projectCode: true, status: true, progress: true },
          orderBy: { createdAt: 'desc' }
        },
        leads: {
          select: { id: true, companyName: true, status: true, expectedValue: true, nextFollowUp: true },
          orderBy: { createdAt: 'desc' }
        },
        activities: {
          include: { performedBy: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    return NextResponse.json({ client });
  } catch (error) {
    console.error("GET Client Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EDIT_CLIENTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const clientId = params.id;

    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, companyId }
    });

    if (!existingClient) return NextResponse.json({ error: "Client not found" }, { status: 404 });

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

    trackChange("status", body.status, existingClient.status, "STATUS_CHANGE");

    const fieldsToTrack = ["name", "email", "phone", "altPhone", "website", "industry", "businessType", "taxNumber", "address", "country", "city", "postalCode", "notes"];
    let metadataChanged = false;
    fieldsToTrack.forEach(f => {
      if (body[f] !== undefined && body[f] !== existingClient[f as keyof typeof existingClient]) {
        updateData[f] = body[f];
        metadataChanged = true;
      }
    });

    if (metadataChanged) {
      activitiesToLog.push({ type: "UPDATED", description: "Client details updated" });
    }

    if (body.tags !== undefined) updateData.tags = body.tags;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No changes detected", client: existingClient });
    }

    activitiesToLog.forEach(a => {
      a.companyId = companyId;
      a.clientId = clientId;
      a.performedById = session.user.id;
    });

    const updatedClient = await prisma.$transaction(async (tx) => {
      const c = await tx.client.update({
        where: { id: clientId },
        data: updateData
      });

      if (activitiesToLog.length > 0) {
        await tx.clientActivity.createMany({ data: activitiesToLog });
      }

      return c;
    });

    return NextResponse.json({ client: updatedClient });
  } catch (error) {
    console.error("PATCH Client Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("DELETE_CLIENTS");
    if (rbacGuard) return rbacGuard;

    const existing = await prisma.client.findFirst({
      where: { id: params.id, companyId }
    });
    if (!existing) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    await prisma.client.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Client Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
