import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { syncAllExistingAssignedLeads } from "@/lib/crm/leadTaskSync";

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rbacGuard = await requirePermission("EDIT_LEADS");
    if (rbacGuard) return rbacGuard;

    const result = await syncAllExistingAssignedLeads(companyId);

    return NextResponse.json({
      success: true,
      message: `Synchronized ${result.synced} of ${result.total} assigned leads to tasks.`,
      ...result
    });
  } catch (error: any) {
    console.error("POST sync-tasks error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
