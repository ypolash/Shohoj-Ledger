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

    const shifts = await prisma.workShift.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { employees: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: shifts });
  } catch (error: any) {
    console.error("Error fetching shifts:", error);
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
    const { name, startTime, endTime, gracePeriod = 0, breakTime = 0, nightShift = false, isActive = true } = body;

    if (!name || !startTime || !endTime) {
      return NextResponse.json({ success: false, error: "Name, start time, and end time are required" }, { status: 400 });
    }

    // Check for duplicate shift name in company
    const existing = await prisma.workShift.findFirst({
      where: { companyId, name: { equals: name, mode: "insensitive" } }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: `A shift named "${name}" already exists.` }, { status: 400 });
    }

    const newShift = await prisma.workShift.create({
      data: {
        companyId,
        name,
        startTime,
        endTime,
        gracePeriod: Number(gracePeriod) || 0,
        breakTime: Number(breakTime) || 0,
        nightShift: Boolean(nightShift),
        isActive: Boolean(isActive)
      },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: newShift }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating work shift:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
