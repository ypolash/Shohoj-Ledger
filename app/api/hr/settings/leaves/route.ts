import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

function parseLeaveType(type: any) {
  if (!type) return type;
  let quotaModel = "ANNUAL";
  let cleanDesc = type.description || "";
  if (type.description?.startsWith("[QUOTA:")) {
    const match = type.description.match(/^\[QUOTA:(ANNUAL|MONTHLY|DAILY)\]\s*(.*)$/s);
    if (match) {
      quotaModel = match[1];
      cleanDesc = match[2] || "";
    }
  }
  return {
    ...type,
    quotaModel,
    displayDescription: cleanDesc,
  };
}

function encodeDescription(description?: string | null, quotaModel?: string) {
  const model = quotaModel && ["ANNUAL", "MONTHLY", "DAILY"].includes(quotaModel) ? quotaModel : "ANNUAL";
  const clean = description ? description.replace(/^\[QUOTA:(ANNUAL|MONTHLY|DAILY)\]\s*/s, '').trim() : '';
  return clean ? `[QUOTA:${model}] ${clean}` : `[QUOTA:${model}]`;
}

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

    const parsedData = leaveTypes.map(parseLeaveType);
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
      carryForwardLimit = 0
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

    const encodedDesc = encodeDescription(description, quotaModel);

    const newType = await prisma.leaveType.create({
      data: {
        companyId,
        name: name.trim(),
        description: encodedDesc,
        isPaid: Boolean(isPaid),
        leavePolicies: {
          create: {
            accrualRate: Number(accrualRate) || 0,
            maxBalance: maxBalance !== null && maxBalance !== undefined && maxBalance !== "" ? Number(maxBalance) : null,
            carryForward: Boolean(carryForward),
            carryForwardLimit: carryForward ? Number(carryForwardLimit) || 0 : null,
            approvalLevels: 1
          }
        }
      },
      include: { leavePolicies: true }
    });

    return NextResponse.json({ success: true, data: parseLeaveType(newType) }, { status: 201 });
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
    const { id, name, accrualRate, maxBalance, carryForward, carryForwardLimit, isPaid, description, quotaModel } = body;

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
    const existingParsed = parseLeaveType(existing);
    const targetModel = quotaModel || existingParsed.quotaModel;
    const targetDesc = description !== undefined ? description : existingParsed.displayDescription;
    const encodedDesc = encodeDescription(targetDesc, targetModel);

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
          ...(accrualRate !== undefined && { accrualRate: Number(accrualRate) }),
          ...(maxBalance !== undefined && { maxBalance: maxBalance !== null && maxBalance !== "" ? Number(maxBalance) : null }),
          ...(carryForward !== undefined && { carryForward: Boolean(carryForward) }),
          ...(carryForwardLimit !== undefined && { carryForwardLimit: carryForward ? Number(carryForwardLimit) : null }),
        }
      });
    } else {
      await prisma.leavePolicy.create({
        data: {
          leaveTypeId: id,
          accrualRate: Number(accrualRate) || 0,
          maxBalance: maxBalance !== null && maxBalance !== undefined && maxBalance !== "" ? Number(maxBalance) : null,
          carryForward: Boolean(carryForward),
          carryForwardLimit: carryForward ? Number(carryForwardLimit) : null,
        }
      });
    }

    const updated = await prisma.leaveType.findUnique({
      where: { id },
      include: { leavePolicies: true }
    });

    return NextResponse.json({ success: true, data: parseLeaveType(updated) });
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
