import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CRM_FEATURES, ALL_AVAILABLE_FEATURES } from "@/lib/billing/crmFeatures";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Super Admin has full platform access to all features
    if (session.user.platformRole === "SUPER_ADMIN") {
      const allKeys = ALL_AVAILABLE_FEATURES.map((f) => f.key);
      return NextResponse.json({
        isSuperAdmin: true,
        planName: "Super Admin (Unlimited Access)",
        status: "ACTIVE",
        features: allKeys,
        allowedFeatureKeys: allKeys,
      });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({
        isSuperAdmin: false,
        planName: "No Company Assigned",
        status: "INACTIVE",
        features: [],
        allowedFeatureKeys: [],
      });
    }

    // Find active subscription for the company
    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
      include: {
        plan: true,
      },
    });

    if (!subscription || !subscription.plan) {
      // If no subscription record exists yet, provide default CRM features for initial trial/onboarding
      const defaultFeatures = ["crm_dashboard", "crm_customers", "crm_leads"];
      return NextResponse.json({
        isSuperAdmin: false,
        planName: "Free Trial / Starter",
        status: "TRIAL",
        features: defaultFeatures,
        allowedFeatureKeys: defaultFeatures,
      });
    }

    let activeFeatures = subscription.plan.features || [];

    // If the plan has special wildcard or "all" marker
    if (
      activeFeatures.includes("*") ||
      activeFeatures.includes("ALL_FEATURES") ||
      activeFeatures.includes("All Modules")
    ) {
      activeFeatures = ALL_AVAILABLE_FEATURES.map((f) => f.key);
    }

    return NextResponse.json({
      isSuperAdmin: false,
      planName: subscription.plan.name,
      planId: subscription.plan.id,
      status: subscription.status,
      billingCycle: subscription.plan.billingCycle,
      currentPeriodEnd: subscription.currentPeriodEnd,
      features: activeFeatures,
      allowedFeatureKeys: activeFeatures,
    });
  } catch (error: any) {
    console.error("GET /api/crm/plan-features error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
