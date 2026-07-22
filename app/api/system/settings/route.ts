import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_SETTINGS");
    if (rbacGuard) return rbacGuard;

    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' }
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET System Settings Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_SETTINGS");
    if (rbacGuard) return rbacGuard;

    const { key, value, description } = await req.json();
    if (!key || value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description }
    });

    return NextResponse.json({ setting });
  } catch (error) {
    console.error("POST System Settings Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
