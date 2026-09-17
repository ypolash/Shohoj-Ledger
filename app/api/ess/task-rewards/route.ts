import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

/**
 * GET /api/ess/task-rewards
 * Fetches employee's special tasks, claims history, points balance, and payout ledger
 */
export async function GET(req: Request) {
  try {
    const employee = await resolveEssEmployee(req);

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee authentication required" },
        { status: 401, headers: ESS_CORS_HEADERS }
      );
    }

    const companyId = employee.companyId;

    // Fetch company settings
    const setting = await prisma.taskRewardSetting.findUnique({
      where: { companyId },
    });
    const pointRate = setting ? Number(setting.pointToCashRate) : 10;
    const minRedeemPoints = setting?.minRedeemPoints ?? 1;

    // Fetch all open or relevant tasks
    const allTasks = await prisma.taskReward.findMany({
      where: {
        companyId,
        status: { in: ["OPEN", "IN_PROGRESS", "COMPLETED"] },
        OR: [
          { assignedToEmployeeId: null },
          { assignedToEmployeeId: employee.id },
          { assignedToEmployeeId: employee.employeeId },
        ],
      },
      include: {
        submissions: {
          where: { employeeId: employee.id },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Employee's own submissions
    const mySubmissions = await prisma.taskRewardSubmission.findMany({
      where: {
        employeeId: employee.id,
      },
      include: {
        taskReward: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Employee's payouts
    const myPayouts = await prisma.taskRewardPayout.findMany({
      where: {
        employeeId: employee.id,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const approvedSubmissions = mySubmissions.filter((s) => s.status === "APPROVED");
    const totalPointsEarned = approvedSubmissions.reduce((sum, s) => sum + (s.pointsAwarded || 0), 0);
    const totalAmountEarned = approvedSubmissions.reduce((sum, s) => sum + Number(s.rewardAmount || 0), 0);

    const totalPointsRedeemed = myPayouts
      .filter((p) => p.status === "PAID" || p.status === "PROCESSING")
      .reduce((sum, p) => sum + (p.pointsRedeemed || 0), 0);
    const totalAmountRedeemed = myPayouts
      .filter((p) => p.status === "PAID" || p.status === "PROCESSING")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const balancePoints = Math.max(0, totalPointsEarned - totalPointsRedeemed);
    const balanceCash = Math.max(0, Number((balancePoints * pointRate).toFixed(2)));

    return NextResponse.json(
      {
        success: true,
        data: {
          employee: {
            id: employee.id,
            employeeId: employee.employeeId,
            firstName: employee.firstName,
            lastName: employee.lastName,
            designation: employee.designation,
          },
          wallet: {
            totalPointsEarned,
            totalAmountEarned,
            totalPointsRedeemed,
            totalAmountRedeemed,
            balancePoints,
            balanceCash,
            pointToCashRate: pointRate,
            minRedeemPoints,
          },
          tasks: allTasks,
          mySubmissions,
          myPayouts,
        },
      },
      { headers: ESS_CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[ESS Task Rewards GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load ESS task rewards" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
