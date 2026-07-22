import { Prisma } from "@prisma/client";

const DEFAULT_ROLES = [
  "Owner",
  "Admin",
  "HR",
  "Manager",
  "Accountant",
  "Employee"
];

/**
 * Provisions the default roles for a newly registered company.
 * Returns the created Owner role to assign to the primary user.
 * 
 * @param tx The active Prisma transaction client
 * @param companyId The ID of the newly created company
 */
export async function provisionDefaultRoles(
  tx: Prisma.TransactionClient,
  companyId: string
) {
  const roleData = DEFAULT_ROLES.map(role => ({
    companyId,
    name: role,
    isDefault: true
  }));

  // Create roles
  await tx.role.createMany({
    data: roleData,
    skipDuplicates: true
  });

  // Fetch and return the Owner role specifically so it can be assigned
  const ownerRole = await tx.role.findFirst({
    where: { companyId, name: "Owner" }
  });

  if (!ownerRole) {
    throw new Error("Failed to provision default Owner role.");
  }

  return ownerRole;
}
