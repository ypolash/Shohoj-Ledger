import { getSession } from "@/lib/session";

/**
 * Returns a companyId filter to be spread into Prisma where clauses.
 * E.g. prisma.model.findMany({ where: { ...withCompany(), status: 'ACTIVE' } })
 * If the user has no companyId and is not a super admin, it throws or scopes securely.
 */
export async function withCompany(enforce = true) {
  const session = await getSession();

  if (!session || !session.user) {
    if (enforce) throw new Error("UNAUTHORIZED");
    return { companyId: "UNAUTHORIZED_NO_ACCESS" };
  }

  const isSuperAdmin =
    session.user.role === "SUPER_ADMIN" ||
    session.user.platformRole === "SUPER_ADMIN";

  if (session.user.companyId) {
    return { companyId: session.user.companyId };
  }

  if (isSuperAdmin) {
    return {};
  }

  if (enforce) {
    throw new Error("COMPANY_REQUIRED");
  }

  return { companyId: "UNASSIGNED_NO_ACCESS" };
}

/**
 * Returns the companyId directly for assignment during creation (POST).
 */
export async function getCompanyId() {
  const session = await getSession();
  if (!session?.user?.companyId) {
    throw new Error("COMPANY_REQUIRED");
  }
  return session.user.companyId;
}

