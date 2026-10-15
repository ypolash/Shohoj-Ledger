import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";
import { randomUUID } from "crypto";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

function normalizeChecklist(raw: any) {
  if (!raw) return { type: "CHECKLIST", items: [], comments: [] };
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { type: "CHECKLIST", items: [], comments: [] };
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
  return { type: "CHECKLIST", items: [], comments: [] };
}

/**
 * GET /api/mobile/tasks/[id]/comments
 * Returns comments on a task.
 */
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: { id: true, checklist: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404, headers: ESS_CORS_HEADERS }
      );
    }

    const checklist = normalizeChecklist(task.checklist);
    return NextResponse.json({ comments: checklist.comments || [] }, { headers: ESS_CORS_HEADERS });
  } catch (error: any) {
    console.error("[Task Comments] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}

/**
 * POST /api/mobile/tasks/[id]/comments
 * Add a comment to a task by staff.
 * Body: { text: string, author?: string, employeeId?: string }
 */
export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const body = await req.json();
    const text = (body.text || body.comment || "").trim();
    const rawEmployeeId = (body.employeeId || "").trim();
    let author = (body.author || "").trim();

    if (!text) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400, headers: ESS_CORS_HEADERS }
      );
    }

    let emp = await resolveEssEmployee(req);
    if (!emp && rawEmployeeId) {
      emp = await prisma.employee.findFirst({
        where: {
          OR: [
            { employeeId: rawEmployeeId },
            { id: rawEmployeeId },
            { email: rawEmployeeId.toLowerCase() },
          ],
        },
      });
    }

    if (!author && emp) {
      author = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employeeId || "Staff";
    }
    if (!author) {
      author = "Staff";
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404, headers: ESS_CORS_HEADERS }
      );
    }

    const checklist = normalizeChecklist(task.checklist);
    const comments = Array.isArray(checklist.comments) ? [...checklist.comments] : [];

    const newComment = {
      id: randomUUID(),
      author,
      employeeId: emp ? emp.employeeId : (rawEmployeeId || null),
      text,
      createdAt: new Date().toISOString(),
    };

    comments.push(newComment);
    const updatedChecklist = {
      ...checklist,
      comments,
    };

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        checklist: updatedChecklist,
      },
    });

    return NextResponse.json({
      success: true,
      comment: newComment,
      comments,
      task: {
        ...updatedTask,
        checklist: updatedChecklist,
      },
    }, { headers: ESS_CORS_HEADERS });
  } catch (error: any) {
    console.error("[Task Comments] POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
