import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { sendNotification } from "@/lib/notifications/notificationService";
import { logAudit } from "@/lib/audit/auditService";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const whereClause: any = { companyId };
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const notices = await prisma.announcement.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notices });
  } catch (error: any) {
    console.error("[HR Notices GET Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch notices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, targetType = "ALL", targetId = null, priority = "NORMAL" } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Notice title is required" }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Notice content is required" }, { status: 400 });
    }

    const notice = await prisma.announcement.create({
      data: {
        companyId,
        title: title.trim(),
        message: message.trim(),
        targetType: targetType || "ALL",
        targetId: targetId || null,
        priority: priority || "NORMAL",
        status: "ACTIVE",
      },
    });

    // Broadcast in-app notifications to all active employees under this HR / company
    try {
      const employees = await prisma.employee.findMany({
        where: {
          companyId,
          status: "ACTIVE",
          ...(targetType === "DEPARTMENT" && targetId ? { departmentId: targetId } : {}),
        },
        select: { id: true, userId: true, email: true, firstName: true },
      });

      const userIdsToNotify = new Set<string>();
      for (const emp of employees) {
        if (emp.userId) {
          userIdsToNotify.add(emp.userId);
        } else if (emp.email) {
          const user = await prisma.user.findFirst({
            where: { email: emp.email, companyId },
            select: { id: true },
          });
          if (user) userIdsToNotify.add(user.id);
        }
      }

      // Dispatch notifications in batch/sequence
      for (const userId of userIdsToNotify) {
        await sendNotification({
          companyId,
          userId,
          category: "HR",
          title: `Notice: ${title.trim()}`,
          message: message.length > 120 ? message.substring(0, 117) + "..." : message,
          link: "/erp/ess",
          priority: priority === "URGENT" ? "URGENT" : "NORMAL",
        });
      }
    } catch (broadcastErr) {
      console.warn("[HR Notice] Broadcast notifications warning:", broadcastErr);
    }

    // Log audit
    try {
      await logAudit({
        module: "HR",
        entityType: "Announcement",
        entityId: notice.id,
        action: "CREATE",
        description: `Broadcasted company notice: "${notice.title}" to target: ${targetType}`,
        afterValue: { title: notice.title, priority, targetType, targetId },
      });
    } catch (auditErr) {
      console.warn("[HR Notice] Audit log warning:", auditErr);
    }

    return NextResponse.json({ notice }, { status: 201 });
  } catch (error: any) {
    console.error("[HR Notices POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to publish notice" }, { status: 500 });
  }
}
