import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";

/**
 * GET /api/hr/task-rewards/stats
 * Aggregated statistics and leaderboard for Task Rewards & Incentives
 */
export async function GET() {
  try {
    const companyId = await getCompanyId();

    const [
      activeTasksCount,
      completedTasksCount,
      pendingSubmissionsCount,
      approvedSubmissionsCount,
      approvedSubmissions,
      payouts,
      setting,
    ] = await Promise.all([
      prisma.taskReward.count({
        where: { companyId, status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
      prisma.taskReward.count({
        where: { companyId, status: "COMPLETED" },
      }),
      prisma.taskRewardSubmission.count({
        where: {
          taskReward: { companyId },
          status: "PENDING",
        },
      }),
      prisma.taskRewardSubmission.count({
        where: {
          taskReward: { companyId },
          status: "APPROVED",
        },
      }),
      prisma.taskRewardSubmission.findMany({
        where: {
          taskReward: { companyId },
          status: "APPROVED",
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
              avatar: true,
            },
          },
          taskReward: {
            select: {
              category: true,
            },
          },
        },
      }),
      prisma.taskRewardPayout.findMany({
        where: {
          companyId,
          status: "PAID",
        },
        select: {
          amount: true,
          pointsRedeemed: true,
        },
      }),
      prisma.taskRewardSetting.findUnique({
        where: { companyId },
      }),
    ]);

    // Total points earned and total monetary value
    const totalPointsEarned = approvedSubmissions.reduce((sum, s) => sum + (s.pointsAwarded || 0), 0);
    const totalDisbursedCash = payouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalPointsRedeemed = payouts.reduce((sum, p) => sum + (p.pointsRedeemed || 0), 0);
    const totalPointsOutstanding = Math.max(0, totalPointsEarned - totalPointsRedeemed);

    // Leaderboard (by total points earned)
    const employeeEarnings = new Map<string, { employee: any; points: number; totalCash: number; completedTasks: number }>();

    for (const sub of approvedSubmissions) {
      if (!sub.employee) continue;
      const existing = employeeEarnings.get(sub.employeeId) || {
        employee: sub.employee,
        points: 0,
        totalCash: 0,
        completedTasks: 0,
      };
      existing.points += sub.pointsAwarded || 0;
      existing.totalCash += Number(sub.rewardAmount) || 0;
      existing.completedTasks += 1;
      employeeEarnings.set(sub.employeeId, existing);
    }

    const leaderboard = Array.from(employeeEarnings.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        activeTasksCount,
        completedTasksCount,
        pendingSubmissionsCount,
        approvedSubmissionsCount,
        totalPointsEarned,
        totalDisbursedCash,
        totalPointsOutstanding,
        pointToCashRate: setting ? Number(setting.pointToCashRate) : 10,
        leaderboard,
      },
    });
  } catch (error: any) {
    console.error("[Task Rewards Stats Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
