import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const db = prisma as any;

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Company context required" }, { status: 400 });
    }

    const body = await request.json();
    const { targetUserId, targetUserName, targetUserRole } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    const currentUserId = session.user.id;
    const currentUserName = session.user.name || "User";
    const currentUserRole = session.user.role || "Member";

    // 1. Search for an existing DIRECT_MESSAGE channel between these two users in this company
    const existingDmChannels = await db.communityChannel.findMany({
      where: {
        companyId,
        type: "DIRECT_MESSAGE",
        AND: [
          { members: { some: { userId: currentUserId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        members: true,
      },
    });

    if (existingDmChannels.length > 0) {
      const ch = existingDmChannels[0];
      const otherMember = ch.members?.find((m: any) => m.userId !== currentUserId) || ch.members?.[0];
      return NextResponse.json({
        success: true,
        channelId: ch.id,
        isNew: false,
        channel: {
          id: ch.id,
          name: targetUserName || otherMember?.userName || "Direct Message",
          rawName: ch.name,
          topic: ch.topic,
          type: ch.type,
          isPrivate: ch.isPrivate,
          createdAt: ch.createdAt,
          updatedAt: ch.updatedAt,
          memberCount: ch.members?.length || 2,
          messageCount: 0,
          unreadCount: 0,
          hasUnread: false,
          dmParticipant: otherMember || null,
          members: ch.members || [],
        },
      });
    }

    // 2. Create new DM channel
    const channelName = `dm-${currentUserId.slice(0, 6)}-${targetUserId.slice(0, 6)}`;
    const newChannel = await db.communityChannel.create({
      data: {
        name: channelName,
        topic: `Direct message between ${currentUserName} and ${targetUserName || "Member"}`,
        type: "DIRECT_MESSAGE",
        isPrivate: true,
        companyId,
        createdById: currentUserId,
        createdByName: currentUserName,
        members: {
          create: [
            {
              userId: currentUserId,
              userName: currentUserName,
              userRole: currentUserRole,
            },
            {
              userId: targetUserId,
              userName: targetUserName || "Member",
              userRole: targetUserRole || "Member",
            },
          ],
        },
      },
      include: {
        members: true,
      },
    });

    const otherMember = newChannel.members?.find((m: any) => m.userId !== currentUserId) || newChannel.members?.[0];

    return NextResponse.json({
      success: true,
      channelId: newChannel.id,
      isNew: true,
      channel: {
        id: newChannel.id,
        name: targetUserName || otherMember?.userName || "Direct Message",
        rawName: newChannel.name,
        topic: newChannel.topic,
        type: newChannel.type,
        isPrivate: newChannel.isPrivate,
        createdAt: newChannel.createdAt,
        updatedAt: newChannel.updatedAt,
        memberCount: 2,
        messageCount: 0,
        unreadCount: 0,
        hasUnread: false,
        dmParticipant: otherMember || null,
        members: newChannel.members || [],
      },
    });
  } catch (error) {
    console.error("Initiate DM error:", error);
    return NextResponse.json({ error: "Failed to start direct message" }, { status: 500 });
  }
}
