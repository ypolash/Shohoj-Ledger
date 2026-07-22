import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId, getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EXPORT_REPORTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { format, filter } = body; // CSV, PDF

    if (!format) {
      return NextResponse.json({ error: "Format is required" }, { status: 400 });
    }

    const audit = await prisma.reportAudit.create({
      data: {
        companyId,
        userId: session.user.id,
        reportName: "EXECUTIVE_DASHBOARD",
        action: format === "PDF" ? "PRINTED" : "EXPORTED",
        format: format,
        filters: { filter }
      }
    });

    return NextResponse.json({ success: true, auditId: audit.id });
  } catch (error) {
    console.error("POST BI Export Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
