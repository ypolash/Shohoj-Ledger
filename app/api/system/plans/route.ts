import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { price: 'asc' },
    });

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error("GET System Plans Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { name, price, billingCycle, features, maxUsers, status = "ACTIVE" } = body;

    if (!name || price === undefined || !billingCycle) {
      return NextResponse.json({ error: "Missing required fields (name, price, billingCycle)" }, { status: 400 });
    }

    const sanitizedFeatures = Array.isArray(features) ? features.filter((f: any) => typeof f === "string") : [];

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.trim(),
        price: Number(price) || 0,
        billingCycle: billingCycle.toUpperCase(),
        features: sanitizedFeatures,
        maxUsers: maxUsers ? Number(maxUsers) : null,
        status: status.toUpperCase(),
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error("POST System Plans Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const planId = body.planId || body.id;

    if (!planId) {
      return NextResponse.json({ error: "Missing planId parameter" }, { status: 400 });
    }

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = String(body.name).trim();
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.billingCycle !== undefined) updateData.billingCycle = String(body.billingCycle).toUpperCase();
    if (body.maxUsers !== undefined) updateData.maxUsers = body.maxUsers ? Number(body.maxUsers) : null;
    if (body.status !== undefined) updateData.status = String(body.status).toUpperCase();
    if (body.features !== undefined) {
      updateData.features = Array.isArray(body.features)
        ? body.features.filter((f: any) => typeof f === "string")
        : [];
    }

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: updateData,
    });

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (error: any) {
    console.error("PATCH System Plans Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { searchParams } = new URL(req.url);
    const queryPlanId = searchParams.get("planId");
    let planId = queryPlanId;

    if (!planId) {
      const body = await req.json().catch(() => ({}));
      planId = body.planId || body.id;
    }

    if (!planId) {
      return NextResponse.json({ error: "Missing planId parameter" }, { status: 400 });
    }

    // Check if any company subscriptions are linked to this plan
    const subCount = await prisma.subscription.count({
      where: { planId },
    });

    if (subCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete plan because ${subCount} company subscription(s) are currently attached to it. Please archive the plan or reassign those companies first.`,
        },
        { status: 400 }
      );
    }

    await prisma.subscriptionPlan.delete({
      where: { id: planId },
    });

    return NextResponse.json({ success: true, message: "Subscription plan deleted successfully" });
  } catch (error: any) {
    console.error("DELETE System Plans Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
