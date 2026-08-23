import { ReactNode } from "react";
import { requirePermission } from "@/lib/auth/rbac";

interface RequirePermissionProps {
  action: string;
  moduleKey: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default async function RequirePermission({
  action,
  moduleKey,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const hasAccess = await requirePermission(action, moduleKey);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
