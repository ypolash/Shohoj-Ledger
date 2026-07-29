import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_EMPLOYEES");
    if (rbacGuard) return rbacGuard;

    const params = await props.params;
    if (!params.id) {
      return NextResponse.json({ error: "Fine ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !["PENDING", "CANCELLED", "DEDUCTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const fine = await prisma.employeeFine.findUnique({
      where: { id: params.id, companyId }
    });

    if (!fine) {
      return NextResponse.json({ error: "Fine not found" }, { status: 404 });
    }

    if (fine.status === "DEDUCTED" && status !== "DEDUCTED") {
      return NextResponse.json({ error: "Cannot modify a fine that has already been deducted" }, { status: 400 });
    }

    const updatedFine = await prisma.employeeFine.update({
      where: { id: params.id },
      data: { status }
    });

    return NextResponse.json({ fine: updatedFine });
  } catch (error) {
    console.error("PATCH Fine Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_EMPLOYEES");
    if (rbacGuard) return rbacGuard;

    const params = await props.params;
    if (!params.id) {
      return NextResponse.json({ error: "Fine ID is required" }, { status: 400 });
    }

    const fine = await prisma.employeeFine.findUnique({
      where: { id: params.id, companyId }
    });

    if (!fine) {
      return NextResponse.json({ error: "Fine not found" }, { status: 404 });
    }

    if (fine.status === "DEDUCTED") {
      return NextResponse.json({ error: "Cannot delete a deducted fine" }, { status: 400 });
    }

    await prisma.employeeFine.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Fine Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
