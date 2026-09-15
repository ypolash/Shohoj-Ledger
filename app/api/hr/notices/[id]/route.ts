import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { logAudit } from "@/lib/audit/auditService";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const existing = await prisma.announcement.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.message !== undefined) updateData.message = body.message.trim();
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.targetType !== undefined) updateData.targetType = body.targetType;
    if (body.targetId !== undefined) updateData.targetId = body.targetId;

    const updated = await prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    try {
      await logAudit({
        module: "HR",
        entityType: "Announcement",
        entityId: id,
        action: "UPDATE",
        description: `Updated notice: "${updated.title}"`,
        beforeValue: existing,
        afterValue: updated,
      });
    } catch (auditErr) {
      console.warn("[HR Notice] Audit log warning:", auditErr);
    }

    return NextResponse.json({ notice: updated });
  } catch (error: any) {
    console.error("[HR Notice PATCH Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to update notice" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const existing = await prisma.announcement.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    try {
      await logAudit({
        module: "HR",
        entityType: "Announcement",
        entityId: id,
        action: "DELETE",
        description: `Deleted notice "${existing.title}"`,
        beforeValue: existing,
      });
    } catch (auditErr) {
      console.warn("[HR Notice] Audit log warning:", auditErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[HR Notice DELETE Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to delete notice" }, { status: 500 });
  }
}
