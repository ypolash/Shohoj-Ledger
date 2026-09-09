import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.workShift.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Work shift not found" }, { status: 404 });
    }

    const updated = await prisma.workShift.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.endTime !== undefined && { endTime: body.endTime }),
        ...(body.gracePeriod !== undefined && { gracePeriod: Number(body.gracePeriod) }),
        ...(body.breakTime !== undefined && { breakTime: Number(body.breakTime) }),
        ...(body.nightShift !== undefined && { nightShift: Boolean(body.nightShift) }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating shift:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.workShift.findFirst({
      where: { id, companyId },
      include: {
        _count: { select: { employees: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Work shift not found" }, { status: 404 });
    }

    if (existing._count.employees > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete shift "${existing.name}" because ${existing._count.employees} employees are currently assigned to it. Please reassign them first.`
      }, { status: 400 });
    }

    await prisma.workShift.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting shift:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
