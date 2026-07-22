import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Assuming VIEW_NOTIFICATIONS implies viewing public announcements
    const rbacGuard = await requirePermission("VIEW_NOTIFICATIONS");
    if (rbacGuard) return rbacGuard;

    const announcements = await prisma.announcement.findMany({
      where: { companyId, status: "ACTIVE" },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("GET Announcements Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_ANNOUNCEMENTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { title, message, targetType, targetId, priority } = body;

    if (!title || !message || !targetType) {
      return NextResponse.json({ error: "Title, Message, and Target Type are required" }, { status: 400 });
    }

    const announcement = await prisma.$transaction(async (tx) => {
      const a = await tx.announcement.create({
        data: {
          companyId,
          title,
          message,
          targetType,
          targetId: targetId || null,
          priority: priority || "NORMAL"
        }
      });

      await tx.notificationAudit.create({
        data: {
          companyId,
          action: "SENT",
          entityType: "ANNOUNCEMENT",
          entityId: a.id,
          description: `Broadcasted announcement: ${title}`,
          performedById: session.user.id
        }
      });

      // Optionally hook into notificationService here to distribute individual notifications to the target users.

      return a;
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("POST Announcement Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
