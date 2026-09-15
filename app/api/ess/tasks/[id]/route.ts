import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

/**
 * OPTIONS /api/ess/tasks/[id]
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

/**
 * PATCH /api/ess/tasks/[id]
 * Update the status of a task assigned to the authenticated employee.
 * Body: { status: "Pending" | "In Progress" | "Completed" }
 */
export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const employee = await resolveEssEmployee(request);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: ESS_CORS_HEADERS });
    }

    const task = await prisma.task.findFirst({
      where: { id, assignedToEmployeeId: employee.employeeId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found or access denied." }, { status: 404, headers: ESS_CORS_HEADERS });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status field." }, { status: 400, headers: ESS_CORS_HEADERS });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, task: updated }, { headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[ESS] Task update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: ESS_CORS_HEADERS });
  }
}
