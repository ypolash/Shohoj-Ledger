import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rbacGuard = await requirePermission("FINANCE_VIEW");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { reportName, action, format, filters } = body;

    if (!reportName || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const audit = await prisma.reportAudit.create({
      data: {
        companyId,
        userId: session.userId,
        reportName,
        action, // "GENERATED", "EXPORTED", "PRINTED"
        format, // "CSV", "PDF", etc.
        filters: filters ? JSON.stringify(filters) : undefined,
      }
    });

    return NextResponse.json({ audit });
  } catch (error) {
    console.error("Report audit logging error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
