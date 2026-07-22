import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const tasks = await prisma.task.findMany({
      where: { projectId: params.id, companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("GET Tasks Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_TASKS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { title, description, priority, status, assignedToEmployeeId, dueDate, estimatedHours } = body;
    const projectId = params.id;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Verify Project exists
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const newTask = await prisma.$transaction(async (tx) => {
      const t = await tx.task.create({
        data: {
          companyId,
          projectId,
          title,
          description,
          priority: priority || "Medium",
          status: status || "To Do",
          assignedToEmployeeId,
          dueDate: dueDate ? new Date(dueDate) : null,
          estimatedHours: estimatedHours ? Number(estimatedHours) : 0,
        }
      });

      await tx.projectActivity.create({
        data: {
          companyId,
          projectId,
          taskId: t.id,
          type: "TASK_CREATED",
          description: `Task created: ${title}`,
          performedById: session.user.id
        }
      });

      if (assignedToEmployeeId) {
        await tx.projectActivity.create({
          data: {
            companyId,
            projectId,
            taskId: t.id,
            type: "TASK_ASSIGNED",
            description: `Task assigned`,
            newValue: assignedToEmployeeId,
            performedById: session.user.id
          }
        });
      }

      return t;
    });

    return NextResponse.json({ task: newTask });
  } catch (error) {
    console.error("POST Task Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
