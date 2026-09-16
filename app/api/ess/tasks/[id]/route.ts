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

function normalizeChecklist(raw: any) {
  if (!raw) return null;
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (Array.isArray(parsed)) {
    return { type: "CHECKLIST", items: parsed };
  }
  if (parsed && typeof parsed === "object") {
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    return { ...parsed, type: parsed.type || "CHECKLIST", items };
  }
  return null;
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
    const { status, checklist } = body;

    if (!status && checklist === undefined) {
      return NextResponse.json({ error: "Missing status or checklist field." }, { status: 400, headers: ESS_CORS_HEADERS });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (checklist !== undefined) updateData.checklist = checklist;

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      task: {
        ...updated,
        checklist: normalizeChecklist(updated.checklist),
      },
    }, { headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[ESS] Task update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: ESS_CORS_HEADERS });
  }
}
