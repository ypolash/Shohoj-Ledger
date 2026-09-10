import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { recalculateRecentAttendance } from "@/lib/attendance";

export async function POST() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (rbacGuard) return rbacGuard;

    const result = await recalculateRecentAttendance(companyId);

    return NextResponse.json({
      success: true,
      message: `Recalculated ${result.totalChecked} records. Updated ${result.updatedCount} records with accurate late durations.`,
      ...result
    });
  } catch (error: any) {
    console.error("Attendance recalculate error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
