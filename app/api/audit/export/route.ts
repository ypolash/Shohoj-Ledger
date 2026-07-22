import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return new NextResponse("Unauthorized", { status: 401 });

    const rbacGuard = await requirePermission("EXPORT_AUDIT");
    if (rbacGuard) return rbacGuard;

    const url = new URL(req.url);
    const module = url.searchParams.get("module");

    const where: any = { companyId };
    if (module) where.module = module;

    // Fetch maximum 10,000 logs for export to avoid memory overload
    const logs = await prisma.globalAuditLog.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10000 
    });

    // Build CSV
    const headers = ["Date", "User", "Module", "Action", "Entity Type", "Entity ID", "Description", "IP Address", "Status"];
    const rows = logs.map(l => [
      l.createdAt.toISOString(),
      l.user?.name || "System",
      l.module,
      l.action,
      l.entityType,
      l.entityId,
      `"${(l.description || "").replace(/"/g, '""')}"`,
      l.ipAddress || "-",
      l.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const response = new NextResponse(csvContent);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', 'attachment; filename="audit_export.csv"');

    return response;
  } catch (error) {
    console.error("GET Audit Export Error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
