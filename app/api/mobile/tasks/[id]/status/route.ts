import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";
import { getSession } from "@/lib/session";
import { randomUUID } from "crypto";

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

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;

    if (!params?.id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400, headers: ESS_CORS_HEADERS }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { status, checklist, comment, author } = body;

    const validStatuses = ["Pending", "In Progress", "Completed", "Blocked", "To Do"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400, headers: ESS_CORS_HEADERS }
      );
    }

    if (!status && checklist === undefined && !comment) {
      return NextResponse.json(
        { error: "Either status, checklist, or comment is required" },
        { status: 400, headers: ESS_CORS_HEADERS }
      );
    }

    // 1. Resolve employee or session user for authentication
    let employee = await resolveEssEmployee(request, body);
    let sessionUser: any = null;

    try {
      const session = await getSession();
      if (session?.user) {
        sessionUser = session.user;
      }
    } catch (e) {
      // getSession might fail if cookies are missing or running in decoupled context
    }

    // Secondary fallback for employee identification via headers or body
    if (!employee) {
      const headerEmpId =
        request.headers.get("x-employee-id") ||
        request.headers.get("x-employee-db-id") ||
        request.headers.get("employee-id") ||
        body?.employeeId;

      if (headerEmpId) {
        employee = await prisma.employee.findFirst({
          where: {
            OR: [
              { employeeId: headerEmpId },
              { id: headerEmpId },
              { email: headerEmpId },
            ],
          },
        });
      }
    }

    if (!employee && !sessionUser) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication credentials" },
        { status: 401, headers: ESS_CORS_HEADERS }
      );
    }

    // 2. Locate the task in Task table (or TaskReward table fallback)
    let isSpecialReward = false;
    let existingTask: any = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!existingTask) {
      existingTask = await (prisma as any).taskReward.findUnique({
        where: { id: params.id },
      });
      if (existingTask) {
        isSpecialReward = true;
      }
    }

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404, headers: ESS_CORS_HEADERS }
      );
    }

    // 3. Authorization check
    if (employee) {
      const isAssigned =
        !existingTask.assignedToEmployeeId ||
        existingTask.assignedToEmployeeId === employee.employeeId ||
        existingTask.assignedToEmployeeId === employee.id;

      const sameCompany =
        !existingTask.companyId ||
        !employee.companyId ||
        existingTask.companyId === employee.companyId;

      if (!isAssigned && !sameCompany) {
        return NextResponse.json(
          { error: "Access denied: You are not authorized to update this task" },
          { status: 403, headers: ESS_CORS_HEADERS }
        );
      }
    } else if (sessionUser) {
      const isSuperAdmin =
        sessionUser.role === "SUPER_ADMIN" ||
        sessionUser.platformRole === "SUPER_ADMIN";

      if (!isSuperAdmin && existingTask.companyId && sessionUser.companyId && existingTask.companyId !== sessionUser.companyId) {
        return NextResponse.json(
          { error: "Access denied: Cross-company task access forbidden" },
          { status: 403, headers: ESS_CORS_HEADERS }
        );
      }
    }

    // 4. Prepare update payload
    const updateData: any = {};
    if (status && !isSpecialReward) {
      updateData.status = status;
    }
    if (checklist !== undefined) {
      updateData.checklist = checklist;
    }

    if (comment) {
      const baseChecklist = normalizeChecklist(checklist !== undefined ? checklist : existingTask.checklist) || { type: "CHECKLIST", items: [], comments: [] };
      const currentComments = Array.isArray(baseChecklist.comments) ? [...baseChecklist.comments] : [];
      currentComments.push({
        id: randomUUID(),
        author: author || (employee ? `${employee.firstName} ${employee.lastName}`.trim() : "Staff"),
        employeeId: employee?.employeeId || null,
        text: String(comment).trim(),
        createdAt: new Date().toISOString(),
      });
      updateData.checklist = {
        ...baseChecklist,
        comments: currentComments,
      };
    }

    // 5. Execute DB update
    let updatedTask: any;
    if (isSpecialReward) {
      updatedTask = await (prisma as any).taskReward.update({
        where: { id: params.id },
        data: updateData,
      });
    } else {
      updatedTask = await prisma.task.update({
        where: { id: params.id },
        data: updateData,
      });
    }

    // 6. If this task is tied to a CRM lead, log activity on the lead timeline
    try {
      const chk = updatedTask.checklist as any;
      let leadId = chk?.leadId;
      if (!leadId && updatedTask.description) {
        const match = updatedTask.description.match(/\[CRM-LEAD:([^\]]+)\]/);
        if (match) leadId = match[1];
      }

      if (leadId && updatedTask.companyId) {
        await prisma.leadActivity.create({
          data: {
            companyId: updatedTask.companyId,
            leadId,
            type: "TASK_STATUS_UPDATE",
            description: `Staff updated assigned task via Mobile App`,
            newValue: status || "CHECKLIST_UPDATED",
          }
        });
      }
    } catch (actErr) {
      console.error("Failed to log mobile task update to lead activity:", actErr);
    }

    const normalizedChecklist = normalizeChecklist(updatedTask.checklist);

    const mappedTask = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description ?? null,
      status: updatedTask.status || "Pending",
      priority: updatedTask.priority || "Medium",
      dueDate: updatedTask.dueDate ? (typeof updatedTask.dueDate === "string" ? updatedTask.dueDate : updatedTask.dueDate.toISOString()) : null,
      assignedToEmployeeId: updatedTask.assignedToEmployeeId ?? null,
      createdAt: updatedTask.createdAt ? (typeof updatedTask.createdAt === "string" ? updatedTask.createdAt : updatedTask.createdAt.toISOString()) : new Date().toISOString(),
      checklist: normalizedChecklist,
      isSpecialTask: isSpecialReward,
      points: updatedTask.points || 0,
      rewardAmount: updatedTask.monetaryValue ? Number(updatedTask.monetaryValue) : 0,
    };

    return NextResponse.json({
      ...mappedTask,
      task: mappedTask,
      success: true,
    }, { headers: ESS_CORS_HEADERS });
  } catch (error: any) {
    console.error("Error updating task status:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404, headers: ESS_CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
