import { NextResponse } from "next/server";
import { RbacService } from "./rbacService";
import { getSession } from "@/lib/session";

/**
 * Validates whether the authenticated user possesses the required permission.
 * 
 * @param requiredAction The exact permission action (e.g., 'PAYROLL_MANAGE')
 * @returns null if permitted, or a 403 NextResponse if forbidden.
 */
export async function requirePermission(requiredAction: string) {
  const session = await getSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platformRole, roleId, role } = session.user;

  // 1. Super Admin Bypass (Platform Wide)
  if (platformRole === "SUPER_ADMIN") {
    return null; // Full Access everywhere
  }

  // 2. Company Owner Bypass (Tenant Wide)
  if (role === "Owner" || platformRole === "CLIENT_ADMIN") {
    return null; // Full Access inside their own company
  }

  // 3. RBAC Verification
  if (!roleId) {
    return NextResponse.json(
      { error: "Forbidden: No assigned role." },
      { status: 403 }
    );
  }

  // Fetch permitted actions from Cache or DB
  const permittedActions = await RbacService.getRolePermissions(roleId);

  if (!permittedActions.has(requiredAction)) {
    return NextResponse.json(
      { error: `Forbidden: Missing required permission [${requiredAction}]` },
      { status: 403 }
    );
  }

  // Null means the guard passed successfully.
  return null;
}
