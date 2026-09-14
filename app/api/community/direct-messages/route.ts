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
      select: { id: true },
    });

    if (existingDmChannels.length > 0) {
      return NextResponse.json({
        success: true,
        channelId: existingDmChannels[0].id,
        isNew: false,
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
    });

    return NextResponse.json({
      success: true,
      channelId: newChannel.id,
      isNew: true,
    });
  } catch (error) {
    console.error("Initiate DM error:", error);
    return NextResponse.json({ error: "Failed to start direct message" }, { status: 500 });
  }
}
