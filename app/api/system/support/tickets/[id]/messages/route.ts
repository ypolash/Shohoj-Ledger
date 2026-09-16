import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isSuperAdmin = session.user.platformRole === "SUPER_ADMIN";

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Permission check
    if (!isSuperAdmin && ticket.userId !== session.user.id && ticket.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const senderRole = isSuperAdmin ? "SUPER_ADMIN" : "USER";

    const [newMessage] = await Promise.all([
      prisma.supportTicketMessage.create({
        data: {
          ticketId: id,
          senderId: session.user.id,
          senderName: session.user.name || (isSuperAdmin ? "Super Admin" : "User"),
          senderRole,
          message: message.trim(),
        }
      }),
      // If Super Admin replies and ticket is OPEN, transition to IN_PROGRESS
      prisma.supportTicket.update({
        where: { id },
        data: {
          status: isSuperAdmin && ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
          updatedAt: new Date(),
        }
      })
    ]);

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error("POST Support Ticket Message Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
