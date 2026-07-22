import { Prisma } from "@prisma/client";

/**
 * Provisions standard modules for a newly registered company.
 * 
 * @param tx The active Prisma transaction client
 * @param companyId The ID of the newly created company
 * @param selectedModules Array of module keys to enable
 */
export async function provisionModules(
  tx: Prisma.TransactionClient,
  companyId: string,
  selectedModules: string[]
) {
  // 1. Fetch the exact IDs of the requested modules
  const modules = await tx.module.findMany({
    where: { key: { in: selectedModules } }
  });

  if (modules.length === 0) {
    return; // No valid modules found
  }

  // 2. Map and insert CompanyModule relations
  const companyModules = modules.map((mod) => ({
    companyId,
    moduleId: mod.id,
    isActive: true,
  }));

  await tx.companyModule.createMany({
    data: companyModules,
    skipDuplicates: true
  });

  return companyModules;
}
