import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { parseLeaveTypeConfig, encodeLeaveTypeConfig } from "@/lib/hr/leaveTimer";

export async function GET() {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const leaveTypes = await prisma.leaveType.findMany({
      where: { companyId },
      include: { leavePolicies: true },
      orderBy: { createdAt: "asc" }
    });

    const parsedData = leaveTypes.map(parseLeaveTypeConfig);
    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error fetching leave types:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      name,
      description = "",
      quotaModel = "ANNUAL",
      isPaid = true,
      accrualRate = 12,
      maxBalance = 12,
      carryForward = false,
      carryForwardLimit = 0,
      breakDurationMinutes = 30,
      gracePeriodMinutes = 5,
      fineAmount = 50,
      fineType = "FIXED",
      autoFine = true,
      maxPerDay = 2,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Leave type name is required" }, { status: 400 });
    }

    const existing = await prisma.leaveType.findFirst({
      where: { companyId, name: { equals: name.trim(), mode: "insensitive" } }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: `Leave type "${name}" already exists.` }, { status: 400 });
    }

    const encodedDesc = encodeLeaveTypeConfig(description, quotaModel, {
      breakDurationMinutes,
      gracePeriodMinutes,
      fineAmount,
      fineType,
      autoFine,
      maxPerDay,
    });

    const newType = await prisma.leaveType.create({
      data: {
        companyId,
        name: name.trim(),
        description: encodedDesc,
        isPaid: Boolean(isPaid),
        leavePolicies: {
          create: {
            accrualRate: quotaModel === "SHORT_BREAK" ? 0 : Number(accrualRate) || 0,
            maxBalance: maxBalance !== null && maxBalance !== undefined && maxBalance !== "" ? Number(maxBalance) : null,
            carryForward: quotaModel === "SHORT_BREAK" ? false : Boolean(carryForward),
            carryForwardLimit: carryForward ? Number(carryForwardLimit) || 0 : null,
            approvalLevels: 1
          }
        }
      },
      include: { leavePolicies: true }
    });

    return NextResponse.json({ success: true, data: parseLeaveTypeConfig(newType) }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating leave type:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) {
    const attGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (attGuard) return rbacGuard;
  }

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      id,
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

    if (!id) {
      return NextResponse.json({ success: false, error: "Leave type ID is required" }, { status: 400 });
    }

    const existing = await prisma.leaveType.findFirst({
      where: { id, companyId },
      include: { leavePolicies: true }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Leave type not found" }, { status: 404 });
    }

    // If renaming, verify no conflict with other leave types in the same company
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

    // Update leave type
    await prisma.leaveType.update({
      where: { id },
      data: {
        ...(name && name.trim() && { name: name.trim() }),
        ...(isPaid !== undefined && { isPaid: Boolean(isPaid) }),
        description: encodedDesc,
      }
    });

    // Update or create policy
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
    console.error("Error updating leave policy:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) {
    const attGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (attGuard) return rbacGuard;
  }

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Leave type ID is required" }, { status: 400 });
    }

    const existing = await prisma.leaveType.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Leave type not found" }, { status: 404 });
    }

    // Safety check: check if leave requests exist for this leave type
    const requestCount = await prisma.leaveRequest.count({
      where: { leaveTypeId: id }
    });

    if (requestCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete "${existing.name}" because it is linked to ${requestCount} employee leave request(s).`
      }, { status: 400 });
    }

    // Clean up dependent policies & balances in transaction
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
