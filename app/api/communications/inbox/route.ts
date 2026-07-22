import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") || "UNREAD"; // UNREAD, READ, ARCHIVED, PINNED
    const category = url.searchParams.get("category");

    const where: any = { companyId, userId };

    if (filter === "PINNED") {
      where.isPinned = true;
      where.status = { not: "ARCHIVED" };
    } else {
      where.status = filter;
    }

    if (category) {
      where.category = category;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [
        { priority: 'desc' }, // URGENT first
        { createdAt: 'desc' }
      ]
    });

    const unreadCount = await prisma.notification.count({
      where: { companyId, userId, status: "UNREAD" }
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("GET Inbox Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
