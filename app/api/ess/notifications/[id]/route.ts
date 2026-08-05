import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * Resolves the current employee's record from session.
 */
async function resolveEmployee(session: any) {
  const { id, loginType, companyId } = session.user;
  if (loginType === "EMPLOYEE") {
    return prisma.employee.findFirst({ where: { id, companyId } });
  }
  return prisma.employee.findFirst({ where: { userId: id, companyId } });
}

/**
 * PATCH /api/ess/notifications/[id]
 * Updates notification status (e.g. marking as READ) for the authenticated employee.
 */
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employee = await resolveEmployee(session);
    if (!employee || !employee.userId) {
      return NextResponse.json({ error: "Employee record or User account not found." }, { status: 404 });
    }

    const { id } = params;
    const body = await req.json();
    const { status } = body;

    const userId = employee.userId as string;

    const existing = await prisma.notification.findFirst({
      where: { id, companyId: employee.companyId, userId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Notification not found or unauthorized" }, { status: 404 });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { status }
    });

    if (status === "READ" && existing.status === "UNREAD") {
      await prisma.notificationAudit.create({
        data: {
          companyId: employee.companyId,
          action: "READ",
          entityType: "NOTIFICATION",
          entityId: id,
          performedById: userId
        }
      });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("[ESS] PATCH Notification Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
