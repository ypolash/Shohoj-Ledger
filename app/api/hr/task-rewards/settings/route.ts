import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";

/**
 * GET /api/hr/task-rewards/settings
 */
export async function GET() {
  try {
    const companyId = await getCompanyId();

    let setting = await prisma.taskRewardSetting.findUnique({
      where: { companyId },
    });

    if (!setting) {
      setting = await prisma.taskRewardSetting.create({
        data: {
          companyId,
          pointToCashRate: 10,
          minRedeemPoints: 1,
          autoApprove: false,
        },
      });
    }

    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    console.error("[Task Reward Settings GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hr/task-rewards/settings
 * Update company conversion rate and rules
 */
export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const body = await req.json();

    const { pointToCashRate, minRedeemPoints, autoApprove } = body;

    const rateNum = pointToCashRate !== undefined ? parseFloat(pointToCashRate) : 10;
    const minRedeemNum = minRedeemPoints !== undefined ? parseInt(minRedeemPoints, 10) : 1;
    const autoApproveBool = autoApprove !== undefined ? Boolean(autoApprove) : false;

    const setting = await prisma.taskRewardSetting.upsert({
      where: { companyId },
      update: {
        pointToCashRate: isNaN(rateNum) ? 10 : rateNum,
        minRedeemPoints: isNaN(minRedeemNum) ? 1 : minRedeemNum,
        autoApprove: autoApproveBool,
      },
      create: {
        companyId,
        pointToCashRate: isNaN(rateNum) ? 10 : rateNum,
        minRedeemPoints: isNaN(minRedeemNum) ? 1 : minRedeemNum,
        autoApprove: autoApproveBool,
      },
    });

    return NextResponse.json({
      success: true,
      data: setting,
      message: "Task reward settings updated successfully",
    });
  } catch (error: any) {
    console.error("[Task Reward Settings POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
