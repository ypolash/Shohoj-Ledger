import { getSession } from "@/lib/session";

/**
 * Returns a companyId filter to be spread into Prisma where clauses.
 * E.g. prisma.model.findMany({ where: { ...withCompany(), status: 'ACTIVE' } })
 * If the user has no companyId (e.g. Platform Admin), it returns empty unless enforced.
 */
export async function withCompany(enforce = true) {
  const session = await getSession();
  
  if (!session || !session.user) {
    if (enforce) throw new Error("UNAUTHORIZED");
    return {};
  }

  // Admins might not have a companyId. If enforced, they must have one to query business data.
  if (enforce && !session.user.companyId) {
    throw new Error("COMPANY_REQUIRED");
  }

  if (session.user.companyId) {
    return { companyId: session.user.companyId };
  }

  return {};
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
