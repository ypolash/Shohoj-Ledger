import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getSession } from "@/lib/session";

interface RouteParams {
  params: Promise<{ submissionId: string }>;
}

/**
 * POST /api/hr/task-rewards/submissions/[submissionId]/review
 * Approve or Reject an employee's special task reward claim
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { submissionId } = await params;
    const companyId = await getCompanyId();
    const session = await getSession();
    const body = await req.json();

    const { action, reviewNotes, customPoints, customAmount } = body;

    if (!["APPROVE", "REJECT", "RESET"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be APPROVE, REJECT, or RESET." },
        { status: 400 }
      );
    }

    const submission = await prisma.taskRewardSubmission.findUnique({
      where: { id: submissionId },
      include: {
        taskReward: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!submission || submission.taskReward.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: "Task submission not found" },
        { status: 404 }
      );
    }

    const userId = session?.user?.id;

    if (action === "APPROVE") {
      const setting = await prisma.taskRewardSetting.findUnique({
        where: { companyId },
      });
      const rate = setting ? Number(setting.pointToCashRate) : 10;

      const pointsAwarded = customPoints !== undefined ? parseInt(customPoints, 10) : submission.taskReward.points;
      let rewardAmount = customAmount !== undefined ? parseFloat(customAmount) : (
        submission.taskReward.monetaryValue !== null && submission.taskReward.monetaryValue !== undefined
          ? Number(submission.taskReward.monetaryValue)
          : pointsAwarded * rate
      );

      const updated = await prisma.taskRewardSubmission.update({
        where: { id: submissionId },
        data: {
          status: "APPROVED",
          pointsAwarded,
          rewardAmount,
          reviewedByUserId: userId,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
        include: {
          employee: true,
          taskReward: true,
        },
      });

      // Check if task max claims reached
      const approvedCount = await prisma.taskRewardSubmission.count({
        where: {
          taskRewardId: submission.taskRewardId,
          status: "APPROVED",
        },
      });

      if (approvedCount >= submission.taskReward.maxClaims) {
        await prisma.taskReward.update({
          where: { id: submission.taskRewardId },
          data: { status: "COMPLETED" },
        });
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Task submission approved! Awarded ${pointsAwarded} points (৳${rewardAmount}) to ${submission.employee.firstName} ${submission.employee.lastName}.`,
      });
    } else if (action === "REJECT") {
      const updated = await prisma.taskRewardSubmission.update({
        where: { id: submissionId },
        data: {
          status: "REJECTED",
          pointsAwarded: 0,
          rewardAmount: 0,
          rejectionReason: reviewNotes?.trim() || "Rejected by HR/Owner",
          reviewedByUserId: userId,
          reviewedAt: new Date(),
        },
        include: {
          employee: true,
          taskReward: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Task submission rejected.",
      });
    } else {
      // RESET to PENDING
      const updated = await prisma.taskRewardSubmission.update({
        where: { id: submissionId },
        data: {
          status: "PENDING",
          pointsAwarded: 0,
          rewardAmount: 0,
          rejectionReason: null,
          reviewedByUserId: null,
          reviewedAt: null,
        },
        include: {
          employee: true,
          taskReward: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Task submission reset to Pending.",
      });
    }
  } catch (error: any) {
    console.error("[Task Submission Review Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to review task submission" },
      { status: 500 }
    );
  }
}
