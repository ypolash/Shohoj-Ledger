import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const subscriptions = await prisma.subscription.findMany({
      include: {
        company: true,
        plan: true
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("GET System Subscriptions Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { companyId, planId, currentPeriodStart, currentPeriodEnd } = await req.json();

    if (!companyId || !planId || !currentPeriodEnd) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subscription = await prisma.subscription.create({
      data: {
        companyId,
        planId,
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : undefined,
        currentPeriodEnd: new Date(currentPeriodEnd),
      }
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("POST System Subscriptions Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { subscriptionId, status, currentPeriodEnd } = await req.json();
    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (currentPeriodEnd) updateData.currentPeriodEnd = new Date(currentPeriodEnd);

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("PATCH System Subscriptions Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
