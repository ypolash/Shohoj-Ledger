import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { headers } from "next/headers";

const db = prisma as any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-employee-id, x-employee-db-id",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

async function resolveAuthSession() {
  let session = await getSession();
  if (session?.user) return session;

  try {
    const headerList = await headers();
    const empDbId = headerList.get("x-employee-db-id");
    const empId = headerList.get("x-employee-id");

    if (empDbId || empId) {
      const employee = await prisma.employee.findFirst({
        where: {
          OR: [
            ...(empDbId ? [{ id: empDbId }] : []),
            ...(empId ? [{ employeeId: empId }] : []),
          ],
        },
      });

      if (employee) {
        return {
          user: {
            id: employee.id,
            employeeId: employee.employeeId,
            email: employee.email,
            name: `${employee.firstName} ${employee.lastName}`.trim(),
            loginType: "EMPLOYEE",
            role: employee.designation || "Employee",
            companyId: employee.companyId,
          },
        };
      }
    }
  } catch (err) {
    console.error("Auth header resolution error in messages route:", err);
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const session = await resolveAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const since = searchParams.get("since"); // For fast incremental polling / sync

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400, headers: CORS_HEADERS });
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
      return NextResponse.json({ error: "Channel not found" }, { status: 404, headers: CORS_HEADERS });
    }

    // Access check for private / DM
    if (channel.isPrivate || channel.type === "DIRECT_MESSAGE") {
      const isMember = channel.members?.some((m: any) => m.userId === session.user.id);
      if (!isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403, headers: CORS_HEADERS });
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

    return NextResponse.json(
      {
        success: true,
        messages: messages || [],
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const session = await resolveAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const { channelId, content, attachments = [], replyToId = null } = body;

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400, headers: CORS_HEADERS });
    }

    if ((!content || !content.trim()) && attachments.length === 0) {
      return NextResponse.json({ error: "Message must contain text or attachments" }, { status: 400, headers: CORS_HEADERS });
    }

    const companyId = session.user.companyId;

    const channel = await db.communityChannel.findFirst({
      where: { id: channelId, companyId },
      include: {
        members: { select: { userId: true } },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404, headers: CORS_HEADERS });
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
      return NextResponse.json({ error: "Only staff and admins can post in announcements" }, { status: 403, headers: CORS_HEADERS });
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

    return NextResponse.json(
      {
        success: true,
        message,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500, headers: CORS_HEADERS });
  }
}
