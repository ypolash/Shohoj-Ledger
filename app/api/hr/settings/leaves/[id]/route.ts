import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { parseLeaveTypeConfig, encodeLeaveTypeConfig } from "@/lib/hr/leaveTimer";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) {
    const attGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (attGuard) return rbacGuard;
  }

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      accrualRate,
      maxBalance,
      carryForward,
      carryForwardLimit,
      isPaid,
      description,
      quotaModel,
      breakDurationMinutes,
      gracePeriodMinutes,
      fineAmount,
      fineType,
      autoFine,
      maxPerDay,
    } = body;

    const existing = await prisma.leaveType.findFirst({
      where: { id, companyId },
      include: { leavePolicies: true }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Leave type not found" }, { status: 404 });
    }

    if (name && name.trim() && name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const conflict = await prisma.leaveType.findFirst({
        where: {
          companyId,
          name: { equals: name.trim(), mode: "insensitive" },
          id: { not: id }
        }
      });
      if (conflict) {
        return NextResponse.json({ success: false, error: `Leave type "${name.trim()}" already exists.` }, { status: 400 });
      }
    }

    // Parse existing model if not provided
    const existingParsed = parseLeaveTypeConfig(existing);
    const targetModel = quotaModel || existingParsed.quotaModel;
    const targetDesc = description !== undefined ? description : existingParsed.displayDescription;
    const encodedDesc = encodeLeaveTypeConfig(targetDesc, targetModel, {
      breakDurationMinutes: breakDurationMinutes !== undefined ? breakDurationMinutes : existingParsed.breakDurationMinutes,
      gracePeriodMinutes: gracePeriodMinutes !== undefined ? gracePeriodMinutes : existingParsed.gracePeriodMinutes,
      fineAmount: fineAmount !== undefined ? fineAmount : existingParsed.fineAmount,
      fineType: fineType !== undefined ? fineType : existingParsed.fineType,
      autoFine: autoFine !== undefined ? autoFine : existingParsed.autoFine,
      maxPerDay: maxPerDay !== undefined ? maxPerDay : existingParsed.maxPerDay,
    });

    await prisma.leaveType.update({
      where: { id },
      data: {
        ...(name && name.trim() && { name: name.trim() }),
        ...(isPaid !== undefined && { isPaid: Boolean(isPaid) }),
        description: encodedDesc,
      }
    });

    if (existing.leavePolicies.length > 0) {
      await prisma.leavePolicy.update({
        where: { id: existing.leavePolicies[0].id },
        data: {
          ...(accrualRate !== undefined && { accrualRate: targetModel === "SHORT_BREAK" ? 0 : Number(accrualRate) }),
          ...(maxBalance !== undefined && { maxBalance: maxBalance !== null && maxBalance !== "" ? Number(maxBalance) : null }),
          ...(carryForward !== undefined && { carryForward: targetModel === "SHORT_BREAK" ? false : Boolean(carryForward) }),
          ...(carryForwardLimit !== undefined && { carryForwardLimit: carryForward ? Number(carryForwardLimit) : null }),
        }
      });
    } else {
      await prisma.leavePolicy.create({
        data: {
          leaveTypeId: id,
          accrualRate: targetModel === "SHORT_BREAK" ? 0 : Number(accrualRate) || 0,
          maxBalance: maxBalance !== null && maxBalance !== undefined && maxBalance !== "" ? Number(maxBalance) : null,
          carryForward: targetModel === "SHORT_BREAK" ? false : Boolean(carryForward),
          carryForwardLimit: carryForward ? Number(carryForwardLimit) : null,
        }
      });
    }

    const updated = await prisma.leaveType.findUnique({
      where: { id },
      include: { leavePolicies: true }
    });

    return NextResponse.json({ success: true, data: parseLeaveTypeConfig(updated) });
  } catch (error: any) {
    console.error("Error updating leave type:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) {
    const attGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (attGuard) return rbacGuard;
  }

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.leaveType.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Leave type not found" }, { status: 404 });
    }

    const requestCount = await prisma.leaveRequest.count({
      where: { leaveTypeId: id }
    });

    if (requestCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete "${existing.name}" because it is linked to ${requestCount} employee leave request(s).`
      }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.leavePolicy.deleteMany({ where: { leaveTypeId: id } }),
      prisma.leaveBalance.deleteMany({ where: { leaveTypeId: id } }),
      prisma.leaveAccrual.deleteMany({ where: { leaveTypeId: id } }),
      prisma.leaveEncashment.deleteMany({ where: { leaveTypeId: id } }),
      prisma.leaveType.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true, message: `Leave type "${existing.name}" deleted successfully.` });
  } catch (error: any) {
    console.error("Error deleting leave type:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
