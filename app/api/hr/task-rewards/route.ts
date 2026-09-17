import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getSession } from "@/lib/session";

/**
 * GET /api/hr/task-rewards
 * List all task rewards for the current company
 */
export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const employeeId = searchParams.get("employeeId");
    const search = searchParams.get("search")?.trim();

    const where: any = { companyId };

    if (status && status !== "ALL") {
      where.status = status;
    }
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (employeeId && employeeId !== "ALL") {
      where.assignedToEmployeeId = employeeId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const tasks = await prisma.taskReward.findMany({
      where,
      include: {
        assignedEmployee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: true,
          },
        },
        submissions: {
          select: {
            id: true,
            status: true,
            pointsAwarded: true,
            rewardAmount: true,
            employeeId: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error("[Task Rewards GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hr/task-rewards
 * Create a new special reward task
 */
export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    const body = await req.json();

    const {
      title,
      description,
      category = "SPECIAL_TASK",
      priority = "MEDIUM",
      points = 10,
      monetaryValue,
      deadline,
      assignedToEmployeeId,
      departmentId,
      maxClaims = 1,
      checklist,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Task title is required" },
        { status: 400 }
      );
    }

    const pointsNum = parseInt(points, 10) || 10;
    const maxClaimsNum = parseInt(maxClaims, 10) || 1;

    // Resolve user role
    const userRole = session?.user?.loginType === "EMPLOYEE" ? "HR" : "ADMIN";
    const userId = session?.user?.id;

    // Calculate default monetary value from points if not explicitly specified
    let finalMonetaryValue = monetaryValue ? parseFloat(monetaryValue) : null;
    if (finalMonetaryValue === null || isNaN(finalMonetaryValue)) {
      const setting = await prisma.taskRewardSetting.findUnique({
        where: { companyId },
      });
      const rate = setting ? Number(setting.pointToCashRate) : 10;
      finalMonetaryValue = pointsNum * rate;
    }

    const task = await prisma.taskReward.create({
      data: {
        companyId,
        title: title.trim(),
        description: description?.trim() || null,
        category,
        priority,
        points: pointsNum,
        monetaryValue: finalMonetaryValue,
        deadline: deadline ? new Date(deadline) : null,
        assignedToEmployeeId: assignedToEmployeeId || null,
        departmentId: departmentId || null,
        maxClaims: maxClaimsNum,
        checklist: checklist || null,
        createdByRole: userRole,
        createdById: userId,
        status: "OPEN",
        systemSource: "ERP",
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

    return NextResponse.json({ success: true, data: task, message: "Special task created successfully" });
  } catch (error: any) {
    console.error("[Task Rewards POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task reward" },
      { status: 500 }
    );
  }
}
