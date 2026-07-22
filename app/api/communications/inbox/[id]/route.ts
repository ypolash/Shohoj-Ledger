import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId, getSession } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { id } = params;
    const body = await req.json();
    const { status, isPinned } = body;

    // Verify ownership
    const existing = await prisma.notification.findFirst({
      where: { id, companyId, userId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Notification not found or unauthorized" }, { status: 404 });
    }

    const data: any = {};
    if (status) data.status = status;
    if (isPinned !== undefined) data.isPinned = isPinned;

    const notification = await prisma.notification.update({
      where: { id },
      data
    });

    if (status === "READ" && existing.status === "UNREAD") {
      await prisma.notificationAudit.create({
        data: {
          companyId,
          action: "READ",
          entityType: "NOTIFICATION",
          entityId: id,
          performedById: userId
        }
      });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("PATCH Inbox Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { id } = params;

    const existing = await prisma.notification.findFirst({
      where: { id, companyId, userId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Notification not found or unauthorized" }, { status: 404 });
    }

    await prisma.notification.delete({
      where: { id }
    });

    await prisma.notificationAudit.create({
      data: {
        companyId,
        action: "DELETED",
        entityType: "NOTIFICATION",
        entityId: id,
        performedById: userId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Inbox Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
