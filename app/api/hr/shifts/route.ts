import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shifts = await prisma.workShift.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { employees: true, rosters: true }
        }
      }
    });

    return NextResponse.json({ success: true, shifts });
  } catch (error: any) {
    console.error("Fetch shifts error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch shifts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (rbacGuard) return rbacGuard;

    const session = await getSession();
    const companyId = session?.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, startTime, endTime, gracePeriod, breakTime, nightShift, isActive } = body;

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Shift name, start time, and end time are required" },
        { status: 400 }
      );
    }

    const shift = await prisma.workShift.create({
      data: {
        companyId,
        name: name.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        gracePeriod: Number(gracePeriod) || 0,
        breakTime: Number(breakTime) || 0,
        nightShift: Boolean(nightShift),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({ success: true, shift });
  } catch (error: any) {
    console.error("Create shift error:", error);
    return NextResponse.json({ error: error.message || "Failed to create shift" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (rbacGuard) return rbacGuard;

    const session = await getSession();
    const companyId = session?.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, startTime, endTime, gracePeriod, breakTime, nightShift, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Shift ID is required" }, { status: 400 });
    }

    const updated = await prisma.workShift.updateMany({
      where: { id, companyId },
      data: {
        ...(name && { name: name.trim() }),
        ...(startTime && { startTime: startTime.trim() }),
        ...(endTime && { endTime: endTime.trim() }),
        ...(gracePeriod !== undefined && { gracePeriod: Number(gracePeriod) }),
        ...(breakTime !== undefined && { breakTime: Number(breakTime) }),
        ...(nightShift !== undefined && { nightShift: Boolean(nightShift) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      }
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error("Update shift error:", error);
    return NextResponse.json({ error: error.message || "Failed to update shift" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (rbacGuard) return rbacGuard;

    const session = await getSession();
    const companyId = session?.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Shift ID is required" }, { status: 400 });
    }

    await prisma.workShift.deleteMany({
      where: { id, companyId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete shift error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete shift" }, { status: 500 });
  }
}
