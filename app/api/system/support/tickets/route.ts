import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const isSuperAdmin = session.user.platformRole === "SUPER_ADMIN";

    const where: any = {};

    // Non-super-admins only see their own tickets or company's tickets
    if (!isSuperAdmin) {
      if (session.user.companyId) {
        where.OR = [
          { companyId: session.user.companyId },
          { userId: session.user.id }
        ];
      } else {
        where.userId = session.user.id;
      }
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tickets, totalCount, openCount, inProgressCount, resolvedCount, urgentCount] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
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
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.supportTicket.count(isSuperAdmin ? {} : { where: { userId: session.user.id } }),
      prisma.supportTicket.count({ where: { ...(isSuperAdmin ? {} : { userId: session.user.id }), status: "OPEN" } }),
      prisma.supportTicket.count({ where: { ...(isSuperAdmin ? {} : { userId: session.user.id }), status: "IN_PROGRESS" } }),
      prisma.supportTicket.count({ where: { ...(isSuperAdmin ? {} : { userId: session.user.id }), status: "RESOLVED" } }),
      prisma.supportTicket.count({ where: { ...(isSuperAdmin ? {} : { userId: session.user.id }), priority: "URGENT", status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    ]);

    return NextResponse.json({
      tickets,
      metrics: {
        total: totalCount,
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        urgent: urgentCount,
      }
    });
  } catch (error: any) {
    console.error("GET Support Tickets Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, description, priority = "MEDIUM", category = "GENERAL" } = body;

    if (!subject || !description) {
      return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });
    }

    const ticketNumber = `TICK-${Math.floor(100000 + Math.random() * 900000)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        category,
        userId: session.user.id,
        companyId: session.user.companyId || null,
        messages: {
          create: {
            senderId: session.user.id,
            senderName: session.user.name || "Customer",
            senderRole: session.user.platformRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER",
            message: description.trim(),
          }
        }
      },
      include: {
        user: true,
        company: true,
        messages: true,
      }
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("POST Support Tickets Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
