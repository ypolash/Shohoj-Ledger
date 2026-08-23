import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyContext } from "@/lib/auth/getCompanyContext";

export async function hasPermission(
  userId: string,
  loginType: string,
  action: string,
  moduleKey: string
): Promise<boolean> {
  if (!userId || !loginType) return false;

  const context = await getCompanyContext(userId, loginType);

  // Super Admin bypass
  if (context.platformRole === "SUPER_ADMIN") {
    return true;
  }

  // Admin bypass (assuming 'Admin' role implies full access)
  if (context.dbRoleName === "Admin" || context.dbRoleName === "admin") {
    return true;
  }

  if (typeof context.roleId !== "string" || !context.roleId) return false;

  const rolePermission = await prisma.rolePermission.findFirst({
    where: {
      roleId: context.roleId,
      permission: {
        action: action,
        moduleKey: moduleKey,
      },
    },
  });

  return !!rolePermission;
}

export async function requirePermission(action: string, moduleKey: string) {
  const session = await getSession();
  
  if (!session || !session.user || !session.user.id) {
    return false;
  }
  
  // Extract user details from session
  const userId = String(session.user.id);
  // If user has designation, they are an employee, else admin login
  const loginType = String(session.user.loginType || (session.user.designation ? "EMPLOYEE" : "ADMIN"));
  
  return await hasPermission(userId, loginType, action, moduleKey);
}
