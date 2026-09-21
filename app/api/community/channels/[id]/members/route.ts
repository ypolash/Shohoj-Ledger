import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const db = prisma as any;

/**
 * GET /api/community/channels/[id]/members
 * Fetch all members currently part of this channel.
 */
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
      where: { id, companyId },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            userName: true,
            userRole: true,
            userAvatar: true,
            joinedAt: true,
            lastReadAt: true,
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // If private or DM, ensure user has access
    if (channel.isPrivate || channel.type === "DIRECT_MESSAGE") {
      const isMember = channel.members?.some((m: any) => m.userId === session.user.id);
      if (!isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      members: channel.members || [],
    });
  } catch (error) {
    console.error("Fetch channel members error:", error);
    return NextResponse.json({ error: "Failed to fetch channel members" }, { status: 500 });
  }
}

/**
 * POST /api/community/channels/[id]/members
 * Add specific employee(s) or member(s) to the channel.
 */
export async function POST(
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

    // Permission check
    const userRoleLower = (session.user.role || "").toLowerCase();
    const isOwnerOrAdmin =
      session.user.loginType === "ADMIN" ||
      userRoleLower.includes("owner") ||
      userRoleLower.includes("admin") ||
      session.user.platformRole === "SUPER_ADMIN";

    const isCreator = channel.createdById === session.user.id;

    if (!isOwnerOrAdmin && !isCreator && channel.isPrivate) {
      return NextResponse.json(
        { error: "Only channel administrators or the creator can add members to a private channel" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { members = [], memberIds = [] } = body;

    // Collect all member data
    const memberMap = new Map<string, any>();
    if (Array.isArray(members)) {
      for (const m of members) {
        if (m?.id) {
          memberMap.set(m.id, m);
        }
      }
    }

    const targetIds = new Set<string>();
    if (Array.isArray(memberIds)) {
      memberIds.forEach((id: string) => id && targetIds.add(id));
    }
    if (Array.isArray(members)) {
      members.forEach((m: any) => m?.id && targetIds.add(m.id));
    }

    if (targetIds.size === 0) {
      return NextResponse.json({ error: "No members specified to add" }, { status: 400 });
    }

    // Add each member via upsert
    for (const userId of targetIds) {
      const info = memberMap.get(userId);
      await db.communityChannelMember.upsert({
        where: {
          channelId_userId: {
            channelId: id,
            userId,
          },
        },
        update: {
          userName: info?.name || undefined,
          userRole: info?.role || undefined,
          userAvatar: info?.avatar || undefined,
        },
        create: {
          channelId: id,
          userId,
          userName: info?.name || "Member",
          userRole: info?.role || "Member",
          userAvatar: info?.avatar || null,
        },
      });
    }

    // Return refreshed member list
    const updatedChannel = await db.communityChannel.findFirst({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            userName: true,
            userRole: true,
            userAvatar: true,
            joinedAt: true,
          },
        },
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({
      success: true,
      memberCount: updatedChannel?._count?.members || 0,
      members: updatedChannel?.members || [],
    });
  } catch (error) {
    console.error("Add channel members error:", error);
    return NextResponse.json({ error: "Failed to add members to channel" }, { status: 500 });
  }
}

/**
 * PUT /api/community/channels/[id]/members
 * Bulk sync / update channel members (set the exact member list for the channel).
 */
export async function PUT(
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

    // Permission check
    const userRoleLower = (session.user.role || "").toLowerCase();
    const isOwnerOrAdmin =
      session.user.loginType === "ADMIN" ||
      userRoleLower.includes("owner") ||
      userRoleLower.includes("admin") ||
      session.user.platformRole === "SUPER_ADMIN";

    const isCreator = channel.createdById === session.user.id;

    if (!isOwnerOrAdmin && !isCreator && channel.isPrivate) {
      return NextResponse.json(
        { error: "Only channel administrators or the creator can manage members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { members = [], memberIds = [] } = body;

    const memberMap = new Map<string, any>();
    if (Array.isArray(members)) {
      for (const m of members) {
        if (m?.id) {
          memberMap.set(m.id, m);
        }
      }
    }

    const targetIds = new Set<string>();
    if (Array.isArray(memberIds)) {
      memberIds.forEach((id: string) => id && targetIds.add(id));
    }
    if (Array.isArray(members)) {
      members.forEach((m: any) => m?.id && targetIds.add(m.id));
    }

    // Always retain the channel creator
    if (channel.createdById) {
      targetIds.add(channel.createdById);
    }
    // Always retain the current user if they are admin/staff managing it
    targetIds.add(session.user.id);

    // Delete members not in the target list
    await db.communityChannelMember.deleteMany({
      where: {
        channelId: id,
        userId: { notIn: Array.from(targetIds) },
      },
    });

    // Upsert target members
    for (const userId of targetIds) {
      const info = memberMap.get(userId);
      await db.communityChannelMember.upsert({
        where: {
          channelId_userId: {
            channelId: id,
            userId,
          },
        },
        update: {
          userName: info?.name || undefined,
          userRole: info?.role || undefined,
          userAvatar: info?.avatar || undefined,
        },
        create: {
          channelId: id,
          userId,
          userName: info?.name || (userId === session.user.id ? (session.user.name || "Member") : "Member"),
          userRole: info?.role || (userId === session.user.id ? (session.user.role || "Member") : "Member"),
          userAvatar: info?.avatar || null,
        },
      });
    }

    // Return updated channel members
    const updatedChannel = await db.communityChannel.findFirst({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            userName: true,
            userRole: true,
            userAvatar: true,
            joinedAt: true,
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({
      success: true,
      memberCount: updatedChannel?._count?.members || 0,
      members: updatedChannel?.members || [],
    });
  } catch (error) {
    console.error("Sync channel members error:", error);
    return NextResponse.json({ error: "Failed to update channel members" }, { status: 500 });
  }
}

/**
 * DELETE /api/community/channels/[id]/members
 * Remove a specific member from the channel.
 */
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

    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const targetUserId = body.userId || body.memberId || searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID to remove is required" }, { status: 400 });
    }

    // Protect channel creator from being removed
    if (targetUserId === channel.createdById) {
      return NextResponse.json(
        { error: "The channel creator cannot be removed from the channel" },
        { status: 400 }
      );
    }

    const userRoleLower = (session.user.role || "").toLowerCase();
    const isOwnerOrAdmin =
      session.user.loginType === "ADMIN" ||
      userRoleLower.includes("owner") ||
      userRoleLower.includes("admin") ||
      session.user.platformRole === "SUPER_ADMIN";

    const isCreator = channel.createdById === session.user.id;
    const isSelf = targetUserId === session.user.id;

    if (!isOwnerOrAdmin && !isCreator && !isSelf) {
      return NextResponse.json(
        { error: "You do not have permission to remove this member" },
        { status: 403 }
      );
    }

    await db.communityChannelMember.deleteMany({
      where: {
        channelId: id,
        userId: targetUserId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove channel member error:", error);
    return NextResponse.json({ error: "Failed to remove member from channel" }, { status: 500 });
  }
}
