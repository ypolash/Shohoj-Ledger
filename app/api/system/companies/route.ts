import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    // Platform Admins can fetch ALL companies, regardless of session companyId.
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("GET System Companies Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { companyId, status } = await req.json();
    if (!companyId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data: { status }
    });

    return NextResponse.json({ company });
  } catch (error) {
    console.error("PATCH System Companies Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
