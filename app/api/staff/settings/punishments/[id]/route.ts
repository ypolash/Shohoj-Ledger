import { verifyOwnership } from "@/lib/company/verifyOwnership";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) {
    const attGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (attGuard) return rbacGuard;
  }

  try {
    const { id } = await params;
    const ownershipError = await verifyOwnership("punishmentSetting", id);
    if (ownershipError) return ownershipError;

    const body = await request.json();
    
    const updatedSetting = await prisma.punishmentSetting.update({
      where: { id },
      data: {
        type: body.type !== undefined ? body.type : undefined,
        fromMinutes: body.fromMinutes !== undefined ? Number(body.fromMinutes) : undefined,
        toMinutes: body.toMinutes !== undefined ? Number(body.toMinutes) : undefined,
        amount: body.amount !== undefined ? Number(body.amount) : undefined,
        active: body.active !== undefined ? Boolean(body.active) : undefined
      }
    });
    
    return NextResponse.json(updatedSetting);
  } catch (error: any) {
    console.error("Failed to update punishment slab:", error);
    return NextResponse.json({ error: error.message || "Failed to update slab" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) {
    const attGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (attGuard) return rbacGuard;
  }

  try {
    const { id } = await params;
    const ownershipError = await verifyOwnership("punishmentSetting", id);
    if (ownershipError) return ownershipError;
    
    await prisma.punishmentSetting.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete punishment slab:", error);
    return NextResponse.json({ error: error.message || "Failed to delete slab" }, { status: 500 });
  }
}
