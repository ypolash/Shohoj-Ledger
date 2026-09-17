import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getSession } from "@/lib/session";

/**
 * GET /api/hr/task-rewards/payouts
 * Returns:
 * 1. Employee wallets (total points earned, redeemed, remaining balance, cash value)
 * 2. Payout history records
 */
export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    // Fetch company conversion settings
    const setting = await prisma.taskRewardSetting.findUnique({
      where: { companyId },
    });
    const pointRate = setting ? Number(setting.pointToCashRate) : 10;
    const minRedeemPoints = setting?.minRedeemPoints ?? 1;

    // Fetch all active employees for this company
    const employeeWhere: any = { companyId };
    if (employeeId && employeeId !== "ALL") {
      employeeWhere.id = employeeId;
    }

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        department: true,
        designation: true,
        phone: true,
        email: true,
        status: true,
      },
      orderBy: { firstName: "asc" },
    });

    // Fetch all approved submissions for this company
    const approvedSubmissions = await prisma.taskRewardSubmission.findMany({
      where: {
        companyId,
        status: "APPROVED",
      },
      select: {
        employeeId: true,
        pointsAwarded: true,
        rewardAmount: true,
      },
    });

    // Fetch all payouts for this company
    const payouts = await prisma.taskRewardPayout.findMany({
      where: {
        companyId,
        ...(employeeId && employeeId !== "ALL" ? { employeeId } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
            designation: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate by employee
    const earnedMap = new Map<string, { points: number; amount: number }>();
    for (const sub of approvedSubmissions) {
      const current = earnedMap.get(sub.employeeId) || { points: 0, amount: 0 };
      current.points += sub.pointsAwarded || 0;
      current.amount += Number(sub.rewardAmount) || 0;
      earnedMap.set(sub.employeeId, current);
    }

    const redeemedMap = new Map<string, { points: number; amount: number }>();
    for (const pay of payouts) {
      if (pay.paymentStatus === "PAID" || pay.paymentStatus === "PROCESSING") {
        const current = redeemedMap.get(pay.employeeId) || { points: 0, amount: 0 };
        current.points += pay.pointsRedeemed || 0;
        current.amount += Number(pay.amount) || 0;
        redeemedMap.set(pay.employeeId, current);
      }
    }

    const wallets = employees.map((emp) => {
      const earned = earnedMap.get(emp.id) || { points: 0, amount: 0 };
      const redeemed = redeemedMap.get(emp.id) || { points: 0, amount: 0 };
      const balancePoints = Math.max(0, earned.points - redeemed.points);
      const balanceCash = Math.max(0, Number((balancePoints * pointRate).toFixed(2)));

      return {
        employee: emp,
        totalPointsEarned: earned.points,
        totalAmountEarned: earned.amount,
        totalPointsRedeemed: redeemed.points,
        totalAmountRedeemed: redeemed.amount,
        balancePoints,
        balanceCash,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        wallets: wallets.filter((w) => w.totalPointsEarned > 0 || employeeId),
        allEmployees: employees,
        payouts,
        settings: {
          pointToCashRate: pointRate,
          minRedeemPoints,
          autoApprove: setting?.autoApprove ?? false,
        },
      },
    });
  } catch (error: any) {
    console.error("[Task Reward Payouts GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load payouts data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hr/task-rewards/payouts
 * Disburse extra income to an employee for their earned task points
 */
export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    const body = await req.json();

    const {
      employeeId,
      pointsToRedeem,
      payoutMethod = "CASH",
      reference,
      notes,
      payrollMonth,
      payrollYear,
    } = body;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Employee selection is required" },
        { status: 400 }
      );
    }

    const pointsNum = parseInt(pointsToRedeem, 10);
    if (!pointsNum || pointsNum <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid points amount to redeem is required" },
        { status: 400 }
      );
    }

    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    // Get settings for rate
    const setting = await prisma.taskRewardSetting.findUnique({
      where: { companyId },
    });
    const pointRate = setting ? Number(setting.pointToCashRate) : 10;
    const minRedeem = setting?.minRedeemPoints ?? 1;

    if (pointsNum < minRedeem) {
      return NextResponse.json(
        { success: false, error: `Minimum points required to redeem is ${minRedeem} pts` },
        { status: 400 }
      );
    }

    // Calculate current balance
    const approvedSubmissions = await prisma.taskRewardSubmission.findMany({
      where: {
        employeeId,
        status: "APPROVED",
        companyId,
      },
      select: { pointsAwarded: true },
    });

    const totalEarnedPoints = approvedSubmissions.reduce((sum, s) => sum + (s.pointsAwarded || 0), 0);

    const existingPayouts = await prisma.taskRewardPayout.findMany({
      where: {
        employeeId,
        companyId,
        paymentStatus: { in: ["PAID", "PROCESSING"] },
      },
      select: { pointsRedeemed: true },
    });

    const totalRedeemedPoints = existingPayouts.reduce((sum, p) => sum + (p.pointsRedeemed || 0), 0);
    const availablePoints = totalEarnedPoints - totalRedeemedPoints;

    if (pointsNum > availablePoints) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient points balance. Available: ${availablePoints} pts, Requested: ${pointsNum} pts.`,
        },
        { status: 400 }
      );
    }

    const payoutAmount = parseFloat((pointsNum * pointRate).toFixed(2));
    const userId = session?.user?.id;

    // Create payout record
    const payout = await prisma.taskRewardPayout.create({
      data: {
        companyId,
        employeeId,
        pointsRedeemed: pointsNum,
        amount: payoutAmount,
        payoutMethod,
        referenceNo: reference?.trim() || null,
        notes: notes?.trim() || null,
        payrollMonth: payrollMonth ? parseInt(payrollMonth, 10) : null,
        payrollYear: payrollYear ? parseInt(payrollYear, 10) : null,
        paymentStatus: "PAID",
        processedByUserId: userId,
      },
      include: {
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

    return NextResponse.json({
      success: true,
      data: payout,
      message: `Successfully disbursed ৳${payoutAmount} (${pointsNum} pts) to ${employee.firstName} ${employee.lastName} via ${payoutMethod.replace("_", " ")}!`,
    });
  } catch (error: any) {
    console.error("[Task Reward Payout POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process payout" },
      { status: 500 }
    );
  }
}
