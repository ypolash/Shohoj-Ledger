import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/hr/task-rewards/[id]/submit
 * Submit a claim/proof for completing a special task reward
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    const body = await req.json().catch(() => ({}));
    const employee = await resolveEssEmployee(req, body);

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee authentication required" },
        { status: 401, headers: ESS_CORS_HEADERS }
      );
    }

    const task = await prisma.taskReward.findUnique({
      where: { id: taskId },
      include: {
        submissions: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Special task not found" },
        { status: 404, headers: ESS_CORS_HEADERS }
      );
    }

    // Verify company match
    if (task.companyId !== employee.companyId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to this task" },
        { status: 403, headers: ESS_CORS_HEADERS }
      );
    }

    // Check if task is open
    if (task.status === "COMPLETED" || task.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, error: `This task is already ${task.status.toLowerCase()}` },
        { status: 400, headers: ESS_CORS_HEADERS }
      );
    }

    // Check if assigned to a specific employee
    if (task.assignedToEmployeeId && task.assignedToEmployeeId !== employee.id && task.assignedToEmployeeId !== employee.employeeId) {
      return NextResponse.json(
        { success: false, error: "This task is exclusively assigned to another employee" },
        { status: 403, headers: ESS_CORS_HEADERS }
      );
    }

    // Check deadline if present
    if (task.deadline && new Date() > new Date(task.deadline)) {
      return NextResponse.json(
        { success: false, error: "Deadline for this special task has expired" },
        { status: 400, headers: ESS_CORS_HEADERS }
      );
    }

    // Check existing submissions by this employee
    const existingSubmission = task.submissions.find(
      (s) => s.employeeId === employee.id && (s.status === "PENDING" || s.status === "APPROVED")
    );

    if (existingSubmission) {
      return NextResponse.json(
        {
          success: false,
          error:
            existingSubmission.status === "APPROVED"
              ? "You have already completed and been rewarded for this task"
              : "You already have a pending submission under review for this task",
        },
        { status: 400, headers: ESS_CORS_HEADERS }
      );
    }

    // Check max claims limit
    const approvedCount = task.submissions.filter((s) => s.status === "APPROVED").length;
    if (approvedCount >= task.maxClaims) {
      return NextResponse.json(
        { success: false, error: "Maximum claims limit has already been reached for this task" },
        { status: 400, headers: ESS_CORS_HEADERS }
      );
    }

    const { submissionNotes, proofUrl } = body;

    // Check company auto-approve setting
    const setting = await prisma.taskRewardSetting.findUnique({
      where: { companyId: task.companyId },
    });

    const isAutoApprove = setting?.autoApprove ?? false;
    const rate = setting ? Number(setting.pointToCashRate) : 10;
    const calculatedRewardAmount = task.monetaryValue ? Number(task.monetaryValue) : task.points * rate;

    const submission = await prisma.taskRewardSubmission.create({
      data: {
        companyId: task.companyId,
        taskRewardId: task.id,
        employeeId: employee.id,
        status: isAutoApprove ? "APPROVED" : "PENDING",
        submissionNotes: submissionNotes?.trim() || null,
        proofUrl: proofUrl || null,
        pointsAwarded: isAutoApprove ? task.points : 0,
        rewardAmount: isAutoApprove ? calculatedRewardAmount : 0,
        reviewedAt: isAutoApprove ? new Date() : null,
        rejectionReason: null,
      },
      include: {
        taskReward: true,
        employee: {
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

    // If auto approved and max claims reached, update task status
    if (isAutoApprove && approvedCount + 1 >= task.maxClaims) {
      await prisma.taskReward.update({
        where: { id: task.id },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: submission,
        message: isAutoApprove
          ? `Task verified! You earned ${task.points} reward points (৳${calculatedRewardAmount})!`
          : "Task completion submitted! Waiting for HR/Owner approval.",
      },
      { headers: ESS_CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[Task Reward Submit Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit task claim" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
