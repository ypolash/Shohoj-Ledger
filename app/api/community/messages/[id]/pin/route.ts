import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const db = prisma as any;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: messageId } = await params;

    const message = await db.communityMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const updated = await db.communityMessage.update({
      where: { id: messageId },
      data: { isPinned: !message.isPinned },
    });

    return NextResponse.json({
      success: true,
      isPinned: updated.isPinned,
    });
  } catch (error) {
    console.error("Toggle pin message error:", error);
    return NextResponse.json({ error: "Failed to toggle pin" }, { status: 500 });
  }
}
