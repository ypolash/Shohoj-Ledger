import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireModule } from "@/lib/modules/moduleGuard";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  const rbacGuard = await requirePermission("ATTENDANCE_VIEW");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ATTENDANCE");
  if (moduleGuard) return moduleGuard;

  try {
    const networks = await prisma.allowedNetwork.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: networks });
  } catch (error) {
    console.error("Failed to fetch networks:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ATTENDANCE");
  if (moduleGuard) return moduleGuard;

  try {
    const body = await req.json();
    const { name, ssid, bssid, isActive } = body;

    if (!ssid || !bssid) {
      return NextResponse.json(
        { success: false, message: "SSID and BSSID are required" },
        { status: 400 }
      );
    }

    const existingNetwork = await prisma.allowedNetwork.findUnique({
      where: { ...(await withCompany()), bssid },
    });

    if (existingNetwork) {
      return NextResponse.json(
        { success: false, message: "A network with this BSSID already exists" },
        { status: 400 }
      );
    }

    const newNetwork = await prisma.allowedNetwork.create({
      data: {
        name: name || ssid,
        ssid,
        bssid,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: newNetwork }, { status: 201 });
  } catch (error) {
    console.error("Failed to create network:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
