import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/hr/task-rewards/[id]
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();

    const task = await prisma.taskReward.findFirst({
      where: { id, companyId },
      include: {
        assignedEmployee: true,
        submissions: {
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
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/hr/task-rewards/[id]
 */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();
    const body = await req.json();

    const {
      title,
      description,
      category,
      priority,
      points,
      monetaryValue,
      deadline,
      status,
      assignedToEmployeeId,
      departmentId,
      maxClaims,
      checklist,
    } = body;

    const existing = await prisma.taskReward.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const updated = await prisma.taskReward.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(category !== undefined && { category }),
        ...(priority !== undefined && { priority }),
        ...(points !== undefined && { points: parseInt(points, 10) }),
        ...(monetaryValue !== undefined && { monetaryValue: parseFloat(monetaryValue) }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(status !== undefined && { status }),
        ...(assignedToEmployeeId !== undefined && { assignedToEmployeeId: assignedToEmployeeId || null }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(maxClaims !== undefined && { maxClaims: parseInt(maxClaims, 10) }),
        ...(checklist !== undefined && { checklist }),
      },
      include: {
        assignedEmployee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            designation: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated, message: "Task updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/hr/task-rewards/[id]
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();

    const existing = await prisma.taskReward.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    await prisma.taskReward.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
