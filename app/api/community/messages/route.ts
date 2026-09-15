import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const db = prisma as any;

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const since = searchParams.get("since"); // For fast incremental polling / sync

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    const companyId = session.user.companyId;

    // Verify channel belongs to company
    const channel = await db.communityChannel.findFirst({
      where: { id: channelId, companyId },
      include: {
        members: {
          select: { userId: true },
        },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Access check for private / DM
    if (channel.isPrivate || channel.type === "DIRECT_MESSAGE") {
      const isMember = channel.members?.some((m: any) => m.userId === session.user.id);
      if (!isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const whereClause: any = { channelId };
    if (since) {
      whereClause.createdAt = { gt: new Date(since) };
    }

    const messages = await db.communityMessage.findMany({
      where: whereClause,
      include: {
        attachments: true,
        reactions: true,
        replyTo: {
          select: {
            id: true,
            senderName: true,
            content: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      messages: messages || [],
    });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, content, attachments = [], replyToId = null } = body;

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    if ((!content || !content.trim()) && attachments.length === 0) {
      return NextResponse.json({ error: "Message must contain text or attachments" }, { status: 400 });
    }

    const companyId = session.user.companyId;

    const channel = await db.communityChannel.findFirst({
      where: { id: channelId, companyId },
      include: {
        members: { select: { userId: true } },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check announcement posting permission (only Admins or Staff can post in announcement channels)
    const rawRole = session.user.role || "";
    const isOwnerOrAdmin =
      session.user.loginType === "ADMIN" ||
      rawRole.toLowerCase().includes("owner") ||
      rawRole.toLowerCase().includes("admin") ||
      session.user.platformRole === "SUPER_ADMIN";

    const userType =
      session.user.loginType === "EMPLOYEE"
        ? "STAFF"
        : isOwnerOrAdmin
        ? "ADMIN"
        : "MEMBER";

    const userRole = isOwnerOrAdmin
      ? (rawRole || "Owner")
      : userType === "STAFF"
      ? (rawRole || "Staff")
      : (rawRole || "Member");

    let senderName = session.user.name?.trim();
    if (!senderName) {
      if (session.user.email) {
        senderName = session.user.email.split("@")[0];
      } else if (session.user.employeeId) {
        senderName = `Staff (${session.user.employeeId})`;
      } else {
        senderName = isOwnerOrAdmin ? "Owner" : "Staff Member";
      }
    }

    if (channel.type === "ANNOUNCEMENT" && userType === "MEMBER") {
      return NextResponse.json({ error: "Only staff and admins can post in announcements" }, { status: 403 });
    }

    // Create the message with attachments
    const message = await db.communityMessage.create({
      data: {
        channelId,
        senderId: session.user.id,
        senderName: senderName,
        senderRole: userRole,
        senderType: userType,
        senderAvatar: session.user.image || null,
        content: content ? content.trim() : "",
        replyToId: replyToId || null,
        attachments: {
          create: attachments.map((att: any) => ({
            fileName: att.fileName || "attachment",
            fileUrl: att.fileUrl,
            fileType: att.fileType || "application/octet-stream",
            fileSize: att.fileSize || 0,
          })),
        },
      },
      include: {
        attachments: true,
        reactions: true,
        replyTo: {
          select: {
            id: true,
            senderName: true,
            content: true,
          },
        },
      },
    });

    // Update channel's updatedAt and user's lastReadAt
    await db.communityChannel.update({
      where: { id: channelId },
      data: { updatedAt: new Date() },
    });

    await db.communityChannelMember.upsert({
      where: {
        channelId_userId: {
          channelId,
          userId: session.user.id,
        },
      },
      update: { lastReadAt: new Date() },
      create: {
        channelId,
        userId: session.user.id,
        userName: session.user.name || "Member",
        userRole,
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
