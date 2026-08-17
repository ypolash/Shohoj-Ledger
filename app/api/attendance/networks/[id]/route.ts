import { verifyOwnership } from "@/lib/company/verifyOwnership";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireModule } from "@/lib/modules/moduleGuard";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  let companyIdForGuard: string;
  try {
    companyIdForGuard = await getCompanyId();
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Company ID required" }, { status: 400 });
  }

  const moduleGuard = await requireModule(companyIdForGuard, "ATTENDANCE");
  if (moduleGuard) return moduleGuard;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, ssid, bssid, isActive, ipAddress } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
    }
    
    if (ssid === undefined && bssid === undefined && ipAddress === undefined && isActive === undefined && name === undefined) {
        // Nothing to update
        return NextResponse.json({ success: false, message: "No data to update" }, { status: 400 });
    }

    let detectedIp = ipAddress;
    if (ipAddress === 'auto') {
      detectedIp = req.headers.get("x-forwarded-for")?.split(',')[0] || req.headers.get("x-real-ip") || '127.0.0.1';
    }

    if (bssid) {
      const existingNetwork = await prisma.allowedNetwork.findFirst({
        where: { bssid, companyId: companyIdForGuard, NOT: { id } },
      });

      if (existingNetwork) {
        return NextResponse.json(
          { success: false, message: "A network with this BSSID already exists" },
          { status: 400 }
        );
      }
    }

    // Pre-flight check for ownership
    const targetNetwork = await prisma.allowedNetwork.findFirst({
      where: { id, companyId: companyIdForGuard }
    });
    if (!targetNetwork) {
      return NextResponse.json({ success: false, message: "Network not found or access denied" }, { status: 404 });
    }
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (ssid !== undefined) updateData.ssid = ssid;
    if (bssid !== undefined) updateData.bssid = bssid;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (detectedIp !== undefined) updateData.ipAddress = detectedIp;

    const updatedNetwork = await prisma.allowedNetwork.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedNetwork });
  } catch (error: any) {
    console.error("Failed to update network:", error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: "This BSSID is already registered in the system (globally)." }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  let companyIdForGuard: string;
  try {
    companyIdForGuard = await getCompanyId();
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Company ID required" }, { status: 400 });
  }

  const moduleGuard = await requireModule(companyIdForGuard, "ATTENDANCE");
  if (moduleGuard) return moduleGuard;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
    }

    // Pre-flight check for ownership
    const targetNetwork = await prisma.allowedNetwork.findFirst({
      where: { id, companyId: companyIdForGuard }
    });
    if (!targetNetwork) {
      return NextResponse.json({ success: false, message: "Network not found or access denied" }, { status: 404 });
    }

    await prisma.allowedNetwork.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Network deleted successfully" });
  } catch (error) {
    console.error("Failed to delete network:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
