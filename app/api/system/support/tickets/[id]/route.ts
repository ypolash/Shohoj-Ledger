import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isSuperAdmin = session.user.platformRole === "SUPER_ADMIN";

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        company: {
          select: { id: true, name: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Permission check for regular users
    if (!isSuperAdmin && ticket.userId !== session.user.id && ticket.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "Forbidden: You cannot access this ticket" }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    console.error("GET Support Ticket Detail Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await req.json();
    const { status, priority, assignedToId } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;

    // Regular users can only close their own ticket
    if (!isSuperAdmin) {
      if (ticket.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (status && status !== "CLOSED") {
        return NextResponse.json({ error: "Users can only close their ticket" }, { status: 403 });
      }
      delete updateData.priority;
      delete updateData.assignedToId;
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        company: true,
        assignedTo: true,
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error: any) {
    console.error("PATCH Support Ticket Detail Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
