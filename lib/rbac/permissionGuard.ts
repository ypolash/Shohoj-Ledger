import { NextResponse } from "next/server";
import { RbacService } from "./rbacService";
import { getSession } from "@/lib/session";
import { DefaultRoleMappings } from "./defaultRoles";

/**
 * Validates whether the authenticated user possesses the required permission.
 * 
 * @param requiredAction The exact permission action (e.g., 'EMPLOYEE_VIEW', 'EMPLOYEE_MANAGE')
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

  if (requiredAction.startsWith("SYSTEM_")) {
    // Platform super admin required for system-level routes
    return NextResponse.json({ error: `Forbidden: Requires SUPER_ADMIN` }, { status: 403 });
  }

  // 2. Company Owner, Admin, CEO Bypass (Tenant Wide)
  const roleNames = (role || "")
    .split(',')
    .map((r: string) => r.trim())
    .filter(Boolean);

  const isFullAdmin = roleNames.some((r: string) => 
    ['owner', 'admin', 'ceo'].includes(r.toLowerCase())
  ) || platformRole === "CLIENT_ADMIN";

  if (isFullAdmin) {
    return null; // Full Access inside their own company
  }

  // Helper function to check aliases
  const checkActionMatch = (allowedList: string[], action: string): boolean => {
    if (allowedList.includes(action)) return true;
    if (action === "EMPLOYEE_MANAGE" && allowedList.includes("MANAGE_EMPLOYEES")) return true;
    if (action === "MANAGE_EMPLOYEES" && allowedList.includes("EMPLOYEE_MANAGE")) return true;
    if (action === "VIEW_PROJECTS" && allowedList.includes("PROJECT_VIEW")) return true;
    if (action === "PROJECT_VIEW" && allowedList.includes("VIEW_PROJECTS")) return true;
    if (action === "VIEW_FINANCIAL_REPORTS" && allowedList.includes("FINANCE_VIEW")) return true;
    return false;
  };

  // 3. Check Assigned Role Personas (Built-in Mappings)
  for (const r of roleNames) {
    const matchedKey = Object.keys(DefaultRoleMappings).find(
      key => key.toLowerCase() === r.toLowerCase()
    );
    if (matchedKey) {
      const allowedActions = DefaultRoleMappings[matchedKey] || [];
      if (checkActionMatch(allowedActions, requiredAction)) {
        return null;
      }
    }
  }

  // 4. Database-backed RBAC Verification
  if (roleId) {
    const permittedActions = await RbacService.getRolePermissions(roleId);
    if (permittedActions.has(requiredAction)) {
      return null;
    }
  }

  // If no assigned roles at all
  if (roleNames.length === 0 && !roleId) {
    return NextResponse.json(
      { error: "Forbidden: No assigned role." },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { error: `Forbidden: Missing required permission [${requiredAction}]` },
    { status: 403 }
  );
}
