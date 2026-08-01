import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("GET System Plans Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { name, price, billingCycle, features, maxUsers } = await req.json();

    if (!name || price === undefined || !billingCycle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        price,
        billingCycle,
        features: features || [],
        maxUsers: maxUsers || null,
      }
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("POST System Plans Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { planId, status } = await req.json();
    if (!planId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { status }
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("PATCH System Plans Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
