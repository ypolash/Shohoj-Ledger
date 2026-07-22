import { verifyOwnership } from "@/lib/company/verifyOwnership";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireModule } from "@/lib/modules/moduleGuard";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ATTENDANCE");
  if (moduleGuard) return moduleGuard;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, ssid, bssid, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
    }

    if (bssid) {
      const existingNetwork = await prisma.allowedNetwork.findFirst({
        where: { ...(await withCompany()), bssid, NOT: { id } },
      });

      if (existingNetwork) {
        return NextResponse.json(
          { success: false, message: "A network with this BSSID already exists" },
          { status: 400 }
        );
      }
    }

    const updatedNetwork = await prisma.allowedNetwork.update({
      where: { ...(await withCompany()), id },
      data: {
        name,
        ssid,
        bssid,
        isActive,
      },
    });

    return NextResponse.json({ success: true, data: updatedNetwork });
  } catch (error) {
    console.error("Failed to update network:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ATTENDANCE");
  if (moduleGuard) return moduleGuard;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
    }

    await prisma.allowedNetwork.delete({
      where: { ...(await withCompany()), id },
    });

    return NextResponse.json({ success: true, message: "Network deleted successfully" });
  } catch (error) {
    console.error("Failed to delete network:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
