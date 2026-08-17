import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ApiErrorHandler } from "@/lib/security/errorHandler";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const filter = searchParams.get("filter") || "unread"; // "all" or "unread"

    const whereClause: any = {
      companyId: session.companyId,
      userId: session.id,
    };

    if (filter === "unread") {
      whereClause.status = "UNREAD";
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        companyId: session.companyId,
        userId: session.id,
        status: "UNREAD",
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: notifications,
      meta: { unreadCount } 
    });
  } catch (error) {
    return ApiErrorHandler.handle(error, "GET_NOTIFICATIONS");
  }
}
