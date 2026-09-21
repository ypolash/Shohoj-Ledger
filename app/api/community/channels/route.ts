import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const db = prisma as any;

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Company context required" }, { status: 400 });
    }

    const userId = session.user.id;
    const userName = session.user.name || "Anonymous";
    const userRole = session.user.role || "Member";

    // 1. Check if default channels exist for this company; if not, seed them
    const existingCount = await db.communityChannel.count({
      where: { companyId },
    });

    if (existingCount === 0) {
      const defaultChannels = [
        {
          name: "announcements",
          topic: "📢 Company announcements, news & official broadcasts",
          type: "ANNOUNCEMENT",
          isPrivate: false,
        },
        {
          name: "general",
          topic: "💬 General company and community discussions",
          type: "CHANNEL",
          isPrivate: false,
        },
        {
          name: "member-support",
          topic: "🤝 Member inquiries, questions, and support",
          type: "CHANNEL",
          isPrivate: false,
        },
      ];

      for (const ch of defaultChannels) {
        await db.communityChannel.create({
          data: {
            name: ch.name,
            topic: ch.topic,
            type: ch.type,
            isPrivate: ch.isPrivate,
            companyId,
            createdById: userId,
            createdByName: userName,
            members: {
              create: {
                userId,
                userName,
                userRole,
              },
            },
          },
        });
      }
    }

    // 2. Fetch all channels accessible to this user in this company
    const channels = await db.communityChannel.findMany({
      where: {
        companyId,
        OR: [
          // Public channels
          { isPrivate: false, type: { not: "DIRECT_MESSAGE" } },
          // Private channels where user is a member
          {
            isPrivate: true,
            members: {
              some: { userId },
            },
          },
          // Direct messages where user is a participant
          {
            type: "DIRECT_MESSAGE",
            members: {
              some: { userId },
            },
          },
        ],
      },
      include: {
        members: {
          select: {
            userId: true,
            userName: true,
            userRole: true,
            userAvatar: true,
            lastReadAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            senderName: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            messages: true,
            members: true,
          },
        },
      },
      orderBy: [
        { type: "asc" }, // ANNOUNCEMENT first, then CHANNEL, then DIRECT_MESSAGE
        { createdAt: "asc" },
      ],
    });

    // Format channels with unread count indicator and DM display names
    const formattedChannels = await Promise.all(
      (channels || []).map(async (ch: any) => {
        let displayName = ch.name;
        let dmParticipant = null;

        if (ch.type === "DIRECT_MESSAGE") {
          const otherMember = ch.members?.find((m: any) => m.userId !== userId);
          if (otherMember) {
            displayName = otherMember.userName;
            dmParticipant = otherMember;
          } else if (ch.members && ch.members.length > 0) {
            displayName = ch.members[0].userName;
            dmParticipant = ch.members[0];
          } else {
            displayName = "Direct Message";
          }
        }

        const userMembership = ch.members?.find((m: any) => m.userId === userId);
        const lastReadAt = userMembership?.lastReadAt;
        const lastMsg = ch.messages?.[0];

        let unreadCount = 0;
        if (lastReadAt) {
          unreadCount = await db.communityMessage.count({
            where: {
              channelId: ch.id,
              senderId: { not: userId },
              createdAt: { gt: lastReadAt },
            },
          });
        } else {
          unreadCount = await db.communityMessage.count({
            where: {
              channelId: ch.id,
              senderId: { not: userId },
            },
          });
        }

        return {
          id: ch.id,
          name: displayName,
          rawName: ch.name,
          topic: ch.topic,
          type: ch.type,
          isPrivate: ch.isPrivate,
          createdAt: ch.createdAt,
          updatedAt: ch.updatedAt,
          memberCount: ch._count?.members || 0,
          messageCount: ch._count?.messages || 0,
          lastMessage: lastMsg || null,
          unreadCount,
          hasUnread: unreadCount > 0,
          dmParticipant,
          members: ch.members || [],
        };
      })
    );

    return NextResponse.json({
      success: true,
      channels: formattedChannels,
    });
  } catch (error) {
    console.error("Fetch community channels error:", error);
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}

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
    const { name, topic, type = "CHANNEL", isPrivate = false, memberIds = [], selectedMembers = [] } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
    }

    // Clean name (lowercase, alphanumeric + hyphens)
    const cleanName = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-");

    if (cleanName.length < 2) {
      return NextResponse.json({ error: "Channel name too short" }, { status: 400 });
    }

    // Check if channel already exists with this name in the company
    const existing = await db.communityChannel.findFirst({
      where: {
        companyId,
        name: cleanName,
        type: { not: "DIRECT_MESSAGE" },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "A channel with this name already exists" }, { status: 400 });
    }

    const userId = session.user.id;
    const userName = session.user.name || "Anonymous";
    const userRole = session.user.role || "Staff";

    // Prepare members to add, starting with the creator
    const membersToCreate: any[] = [
      {
        userId,
        userName,
        userRole,
        userAvatar: session.user.image || null,
      },
    ];

    // Helper map for rich details if selectedMembers array is supplied
    const selectedMembersMap = new Map<string, any>();
    if (Array.isArray(selectedMembers)) {
      for (const sm of selectedMembers) {
        if (sm?.id) {
          selectedMembersMap.set(sm.id, sm);
        }
      }
    }

    // Combine all target member IDs
    const targetMemberIds = new Set<string>();
    if (Array.isArray(memberIds)) {
      memberIds.forEach((id) => id && targetMemberIds.add(id));
    }
    if (Array.isArray(selectedMembers)) {
      selectedMembers.forEach((sm) => sm?.id && targetMemberIds.add(sm.id));
    }

    // Add selected members
    for (const mId of targetMemberIds) {
      if (mId && mId !== userId && !membersToCreate.some((m) => m.userId === mId)) {
        const memDetail = selectedMembersMap.get(mId);
        membersToCreate.push({
          userId: mId,
          userName: memDetail?.name || "Member",
          userRole: memDetail?.role || "Member",
          userAvatar: memDetail?.avatar || null,
        });
      }
    }

    const newChannel = await db.communityChannel.create({
      data: {
        name: cleanName,
        topic: topic ? topic.trim() : null,
        type: type === "ANNOUNCEMENT" ? "ANNOUNCEMENT" : "CHANNEL",
        isPrivate: Boolean(isPrivate),
        companyId,
        createdById: userId,
        createdByName: userName,
        members: {
          create: membersToCreate,
        },
      },
      include: {
        members: true,
        _count: {
          select: { messages: true, members: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      channel: {
        id: newChannel.id,
        name: newChannel.name,
        rawName: newChannel.name,
        topic: newChannel.topic,
        type: newChannel.type,
        isPrivate: newChannel.isPrivate,
        memberCount: newChannel._count?.members || 0,
        messageCount: 0,
        lastMessage: null,
        hasUnread: false,
      },
    });
  } catch (error) {
    console.error("Create channel error:", error);
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}
