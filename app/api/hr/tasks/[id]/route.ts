import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { logAudit } from "@/lib/audit/auditService";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const existing = await prisma.task.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description ? body.description.trim() : null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.checklist !== undefined) updateData.checklist = body.checklist;

    if (body.assignedToEmployeeId !== undefined) {
      const employee = await prisma.employee.findFirst({
        where: {
          companyId,
          OR: [
            { employeeId: body.assignedToEmployeeId },
            { id: body.assignedToEmployeeId },
          ],
        },
      });
      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
      updateData.assignedToEmployeeId = employee.employeeId;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: true,
          },
        },
      },
    });

    try {
      await logAudit({
        module: "HR",
        entityType: "Task",
        entityId: id,
        action: "UPDATE",
        description: `Updated task "${updatedTask.title}" status to "${updatedTask.status}"`,
        beforeValue: existing,
        afterValue: updatedTask,
      });
    } catch (auditErr) {
      console.warn("[HR Task] Audit log warning:", auditErr);
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error("[HR Task PATCH Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const existing = await prisma.task.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    try {
      await logAudit({
        module: "HR",
        entityType: "Task",
        entityId: id,
        action: "DELETE",
        description: `Deleted task "${existing.title}"`,
        beforeValue: existing,
      });
    } catch (auditErr) {
      console.warn("[HR Task] Audit log warning:", auditErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[HR Task DELETE Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to delete task" }, { status: 500 });
  }
}
