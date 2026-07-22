import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_MODULES");
    if (rbacGuard) return rbacGuard;

    const features = await prisma.featureFlag.findMany({
      orderBy: { key: 'asc' }
    });

    return NextResponse.json({ features });
  } catch (error) {
    console.error("GET System Features Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_MODULES");
    if (rbacGuard) return rbacGuard;

    const { key, description, isEnabled, rolloutPercentage, enabledCompanyIds } = await req.json();
    if (!key) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const feature = await prisma.featureFlag.upsert({
      where: { key },
      update: { description, isEnabled, rolloutPercentage, enabledCompanyIds },
      create: { key, description, isEnabled, rolloutPercentage, enabledCompanyIds }
    });

    return NextResponse.json({ feature });
  } catch (error) {
    console.error("POST System Features Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
