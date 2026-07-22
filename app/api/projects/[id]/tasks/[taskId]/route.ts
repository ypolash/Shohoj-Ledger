import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function PATCH(req: Request, { params }: { params: { id: string, taskId: string } }) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_TASKS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { id: projectId, taskId } = params;

    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, projectId, companyId }
    });

    if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const updateData: any = {};
    const activitiesToLog: any[] = [];

    const trackChange = (field: string, newValue: any, oldValue: any, type: string) => {
      if (newValue !== undefined && newValue !== oldValue) {
        updateData[field] = newValue;
        activitiesToLog.push({
          type,
          description: `Changed task ${field}`,
          oldValue: String(oldValue || ""),
          newValue: String(newValue || "")
        });
      }
    };

    trackChange("status", body.status, existingTask.status, "TASK_STATUS");
    trackChange("assignedToEmployeeId", body.assignedToEmployeeId, existingTask.assignedToEmployeeId, "TASK_ASSIGNED");

    const fieldsToTrack = ["title", "description", "priority", "estimatedHours", "actualHours"];
    fieldsToTrack.forEach(f => {
      if (body[f] !== undefined && body[f] !== existingTask[f as keyof typeof existingTask]) {
        updateData[f] = body[f];
      }
    });

    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.checklist !== undefined) updateData.checklist = body.checklist;
    if (body.attachments !== undefined) updateData.attachments = body.attachments;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No changes detected", task: existingTask });
    }

    activitiesToLog.forEach(a => {
      a.companyId = companyId;
      a.projectId = projectId;
      a.taskId = taskId;
      a.performedById = session.user.id;
    });

    const updatedTask = await prisma.$transaction(async (tx) => {
      const t = await tx.task.update({
        where: { id: taskId },
        data: updateData
      });

      if (activitiesToLog.length > 0) {
        await tx.projectActivity.createMany({ data: activitiesToLog });
      }

      return t;
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("PATCH Task Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string, taskId: string } }) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_TASKS");
    if (rbacGuard) return rbacGuard;

    const existing = await prisma.task.findFirst({
      where: { id: params.taskId, projectId: params.id, companyId }
    });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.task.delete({
        where: { id: params.taskId }
      });
      
      await tx.projectActivity.create({
        data: {
          companyId,
          projectId: params.id,
          type: "TASK_DELETED",
          description: `Task deleted: ${existing.title}`,
          performedById: session.user.id
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Task Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
