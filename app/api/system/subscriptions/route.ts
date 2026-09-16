import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const [subscriptions, plans, allCompanies] = await Promise.all([
      prisma.subscription.findMany({
        include: {
          company: true,
          plan: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.subscriptionPlan.findMany({
        where: { status: "ACTIVE" },
        orderBy: { price: "asc" },
      }),
      prisma.company.findMany({
        select: { id: true, name: true, status: true, businessType: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // Calculate metrics
    const activeSubs = subscriptions.filter(s => s.status === "ACTIVE");
    const mrr = activeSubs.reduce((acc, curr) => {
      const price = curr.plan?.price || 0;
      const isYearly = curr.plan?.billingCycle?.toUpperCase() === "YEARLY";
      return acc + (isYearly ? price / 12 : price);
    }, 0);

    const subscribedCompanyIds = new Set(subscriptions.map(s => s.companyId));
    const unassignedCompanies = allCompanies.filter(c => !subscribedCompanyIds.has(c.id));

    return NextResponse.json({
      subscriptions,
      plans,
      allCompanies,
      unassignedCompanies,
      metrics: {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeSubs.length,
        pastDueSubscriptions: subscriptions.filter(s => s.status === "PAST_DUE").length,
        canceledSubscriptions: subscriptions.filter(s => s.status === "CANCELED").length,
        estimatedMRR: Math.round(mrr * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error("GET System Subscriptions Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { companyId, planId, durationDays = 30, status = "ACTIVE" } = await req.json();

    if (!companyId || !planId) {
      return NextResponse.json({ error: "companyId and planId are required" }, { status: 400 });
    }

    const startDate = new Date();
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // Upsert subscription for company
    const subscription = await prisma.subscription.upsert({
      where: { companyId },
      update: {
        planId,
        status,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
      },
      create: {
        companyId,
        planId,
        status,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
      },
      include: {
        company: true,
        plan: true,
      },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error: any) {
    console.error("POST System Subscriptions Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { subscriptionId, status, planId, extendDays, customEndDate } = await req.json();
    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    const currentSub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!currentSub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (planId) updateData.planId = planId;

    if (customEndDate) {
      updateData.currentPeriodEnd = new Date(customEndDate);
    } else if (extendDays) {
      const baseDate = new Date(currentSub.currentPeriodEnd) > new Date() ? new Date(currentSub.currentPeriodEnd) : new Date();
      updateData.currentPeriodEnd = new Date(baseDate.getTime() + extendDays * 24 * 60 * 60 * 1000);
      if (currentSub.status !== "ACTIVE") {
        updateData.status = "ACTIVE";
      }
    }

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        company: true,
        plan: true,
      },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error: any) {
    console.error("PATCH System Subscriptions Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("subscriptionId");

    if (!subscriptionId) {
      return NextResponse.json({ error: "subscriptionId is required" }, { status: 400 });
    }

    await prisma.subscription.delete({
      where: { id: subscriptionId },
    });

    return NextResponse.json({ success: true, message: "Subscription removed successfully" });
  } catch (error: any) {
    console.error("DELETE System Subscriptions Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
