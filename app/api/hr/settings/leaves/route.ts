import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

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

    return NextResponse.json({ success: true, data: leaveTypes });
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

    const newType = await prisma.leaveType.create({
      data: {
        companyId,
        name: name.trim(),
        description: description?.trim() || null,
        isPaid: Boolean(isPaid),
        leavePolicies: {
          create: {
            accrualRate: Number(accrualRate) || 0,
            maxBalance: Number(maxBalance) || 0,
            carryForward: Boolean(carryForward),
            carryForwardLimit: carryForward ? Number(carryForwardLimit) || 0 : null,
            approvalLevels: 1
          }
        }
      },
      include: { leavePolicies: true }
    });

    return NextResponse.json({ success: true, data: newType }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating leave type:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, accrualRate, maxBalance, carryForward, carryForwardLimit, isPaid, description } = body;

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

    // Update leave type
    await prisma.leaveType.update({
      where: { id },
      data: {
        ...(isPaid !== undefined && { isPaid: Boolean(isPaid) }),
        ...(description !== undefined && { description }),
      }
    });

    // Update or create policy
    if (existing.leavePolicies.length > 0) {
      await prisma.leavePolicy.update({
        where: { id: existing.leavePolicies[0].id },
        data: {
          ...(accrualRate !== undefined && { accrualRate: Number(accrualRate) }),
          ...(maxBalance !== undefined && { maxBalance: Number(maxBalance) }),
          ...(carryForward !== undefined && { carryForward: Boolean(carryForward) }),
          ...(carryForwardLimit !== undefined && { carryForwardLimit: carryForward ? Number(carryForwardLimit) : null }),
        }
      });
    } else {
      await prisma.leavePolicy.create({
        data: {
          leaveTypeId: id,
          accrualRate: Number(accrualRate) || 0,
          maxBalance: Number(maxBalance) || 0,
          carryForward: Boolean(carryForward),
          carryForwardLimit: carryForward ? Number(carryForwardLimit) : null,
        }
      });
    }

    const updated = await prisma.leaveType.findUnique({
      where: { id },
      include: { leavePolicies: true }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating leave policy:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
