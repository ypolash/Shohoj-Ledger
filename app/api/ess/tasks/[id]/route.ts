import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    return { type: "CHECKLIST", items: parsed, comments: [] };
  }
  if (parsed && typeof parsed === "object") {
    const items = Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed.todos) ? parsed.todos : []);
    const comments = Array.isArray(parsed.comments) ? parsed.comments : [];
    return { ...parsed, type: parsed.type || "CHECKLIST", items, comments };
  }
  return null;
}

/**
 * PATCH /api/ess/tasks/[id]
 * Update the status/checklist of a task assigned to the authenticated employee.
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
      where: {
        id,
        OR: [
          { assignedToEmployeeId: employee.employeeId },
          { assignedToEmployeeId: employee.id },
          ...(employee.companyId ? [{ companyId: employee.companyId }] : []),
        ],
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found or access denied." }, { status: 404, headers: ESS_CORS_HEADERS });
    }

    const body = await request.json().catch(() => ({}));
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

    const normalizedChecklist = normalizeChecklist(updated.checklist);

    const mappedTask = {
      id: updated.id,
      title: updated.title,
      description: updated.description ?? null,
      status: updated.status || "Pending",
      priority: updated.priority || "Medium",
      dueDate: updated.dueDate ? (typeof updated.dueDate === "string" ? updated.dueDate : updated.dueDate.toISOString()) : null,
      assignedToEmployeeId: updated.assignedToEmployeeId ?? null,
      createdAt: updated.createdAt ? (typeof updated.createdAt === "string" ? updated.createdAt : updated.createdAt.toISOString()) : new Date().toISOString(),
      checklist: normalizedChecklist,
      isSpecialTask: false,
      points: 0,
      rewardAmount: 0,
    };

    return NextResponse.json({
      ...mappedTask,
      task: mappedTask,
      success: true,
    }, { headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[ESS] Task update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: ESS_CORS_HEADERS });
  }
}
