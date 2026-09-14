import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const db = prisma as any;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: messageId } = await params;
    const body = await request.json();
    const { emoji } = body;

    if (!emoji || typeof emoji !== "string") {
      return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
    }

    const userId = session.user.id;
    const userName = session.user.name || "User";

    // Check if reaction already exists
    const existing = await db.communityReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existing) {
      // Remove reaction (toggle off)
      await db.communityReaction.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({ success: true, action: "removed", emoji });
    } else {
      // Add reaction
      const newReaction = await db.communityReaction.create({
        data: {
          messageId,
          userId,
          userName,
          emoji,
        },
      });

      return NextResponse.json({ success: true, action: "added", reaction: newReaction });
    }
  } catch (error) {
    console.error("Toggle reaction error:", error);
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 });
  }
}
