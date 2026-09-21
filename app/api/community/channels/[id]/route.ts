import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const db = prisma as any;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.user.companyId;

    const channel = await db.communityChannel.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            userName: true,
            userRole: true,
            userAvatar: true,
            lastReadAt: true,
            joinedAt: true,
          },
        },
        messages: {
          where: { isPinned: true },
          include: {
            attachments: true,
            reactions: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            messages: true,
            members: true,
          },
        },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check private channel membership
    if (channel.isPrivate || channel.type === "DIRECT_MESSAGE") {
      const isMember = channel.members?.some((m: any) => m.userId === session.user.id);
      if (!isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        name: channel.name,
        topic: channel.topic,
        type: channel.type,
        isPrivate: channel.isPrivate,
        createdById: channel.createdById,
        createdByName: channel.createdByName,
        createdAt: channel.createdAt,
        members: channel.members || [],
        pinnedMessages: channel.messages || [],
        stats: channel._count,
      },
    });
  } catch (error) {
    console.error("Fetch channel details error:", error);
    return NextResponse.json({ error: "Failed to fetch channel" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.user.companyId;
    const body = await request.json();

    // 1. If action is "markRead", update or upsert user's lastReadAt
    if (body.action === "markRead") {
      await db.communityChannelMember.upsert({
        where: {
          channelId_userId: {
            channelId: id,
            userId: session.user.id,
          },
        },
        update: {
          lastReadAt: new Date(),
        },
        create: {
          channelId: id,
          userId: session.user.id,
          userName: session.user.name || "Member",
          userRole: session.user.role || "Member",
          lastReadAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    // 2. Channel update (topic, name)
    const channel = await db.communityChannel.findFirst({
      where: { id, companyId },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const updated = await db.communityChannel.update({
      where: { id },
      data: {
        ...(body.topic !== undefined && { topic: body.topic }),
        ...(body.name && {
          name: body.name.toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
        }),
      },
    });

    return NextResponse.json({ success: true, channel: updated });
  } catch (error) {
    console.error("Update channel error:", error);
    return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.user.companyId;

    const channel = await db.communityChannel.findFirst({
      where: { id, companyId },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Prevent deleting primary general channel
    const defaultProtected = ["general"];
    if (defaultProtected.includes(channel.name.toLowerCase())) {
      return NextResponse.json({ error: "The default #general channel cannot be deleted" }, { status: 400 });
    }

    // Authorization check: Must be Owner, Admin, Super Admin, or the channel creator
    const userRoleLower = (session.user.role || "").toLowerCase();
    const isOwnerOrAdmin =
      session.user.loginType === "ADMIN" ||
      userRoleLower.includes("owner") ||
      userRoleLower.includes("admin") ||
      session.user.platformRole === "SUPER_ADMIN";

    const isCreator = channel.createdById === session.user.id;

    if (!isOwnerOrAdmin && !isCreator) {
      return NextResponse.json(
        { error: "Only the channel creator or company administrators can delete this channel" },
        { status: 403 }
      );
    }

    await db.communityChannel.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Channel #${channel.name} has been deleted successfully`,
    });
  } catch (error) {
    console.error("Delete channel error:", error);
    return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 });
  }
}
