import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { evaluateDailyAbsenceAndPenalties } from "@/lib/attendance";

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (rbacGuard) return rbacGuard;

    const session = await getSession();
    const companyId = session?.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { date } = body;

    const result = await evaluateDailyAbsenceAndPenalties(companyId, date);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Evaluate absent error:", error);
    return NextResponse.json({ error: error.message || "Failed to evaluate absent employees" }, { status: 500 });
  }
}
