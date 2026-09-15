import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { sendNotification } from "@/lib/notifications/notificationService";
import { logAudit } from "@/lib/audit/auditService";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const whereClause: any = { companyId };
    if (employeeId) {
      whereClause.assignedToEmployeeId = employeeId;
    }
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("[HR Tasks GET Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, assignedToEmployeeId, priority, status, dueDate } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    if (!assignedToEmployeeId) {
      return NextResponse.json({ error: "Assigned employee is required" }, { status: 400 });
    }

    // Verify assigned employee belongs to company
    const employee = await prisma.employee.findFirst({
      where: {
        companyId,
        OR: [
          { employeeId: assignedToEmployeeId },
          { id: assignedToEmployeeId },
        ],
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Assigned employee not found in this organization" },
        { status: 404 }
      );
    }

    const task = await prisma.task.create({
      data: {
        companyId,
        title: title.trim(),
        description: description ? description.trim() : null,
        assignedToEmployeeId: employee.employeeId, // Strict link to Employee.employeeId
        priority: priority || "Medium",
        status: status || "Pending",
        dueDate: dueDate ? new Date(dueDate) : null,
        systemSource: "ERP",
      },
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

    // Notify employee in-app if linked user account exists
    try {
      let targetUserId = employee.userId;
      if (!targetUserId && employee.email) {
        const user = await prisma.user.findFirst({
          where: { email: employee.email, companyId },
        });
        if (user) targetUserId = user.id;
      }

      if (targetUserId) {
        const dateStr = dueDate ? ` Due: ${new Date(dueDate).toLocaleDateString()}` : "";
        await sendNotification({
          companyId,
          userId: targetUserId,
          category: "HR",
          title: "New Task Assigned",
          message: `You have been assigned task: "${title.trim()}".${dateStr}`,
          link: "/erp/ess/tasks",
          priority: priority === "Urgent" || priority === "High" ? "HIGH" : "NORMAL",
        });
      }
    } catch (notifErr) {
      console.warn("[HR Task] Notification dispatch warning:", notifErr);
    }

    // Log audit
    try {
      await logAudit({
        module: "HR",
        entityType: "Task",
        entityId: task.id,
        action: "CREATE",
        description: `Assigned task "${task.title}" to ${employee.firstName} ${employee.lastName} (${employee.employeeId})`,
        afterValue: {
          title: task.title,
          assignedToEmployeeId: employee.employeeId,
          priority: task.priority,
          status: task.status,
          dueDate: task.dueDate,
        },
      });
    } catch (auditErr) {
      console.warn("[HR Task] Audit log warning:", auditErr);
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error("[HR Tasks POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
  }
}
