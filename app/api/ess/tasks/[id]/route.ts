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
 * PATCH /api/ess/tasks/[id]
 * Update the status of a task assigned to the authenticated employee.
 * Body: { status: "Pending" | "In Progress" | "Completed" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await resolveEmployee(session);
    if (!employee) {
      return NextResponse.json({ error: "Employee record not found." }, { status: 404 });
    }

    const task = await prisma.task.findFirst({
      where: { id: params.id, assignedToEmployeeId: employee.id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found or access denied." }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status field." }, { status: 400 });
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error("[ESS] Task update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
