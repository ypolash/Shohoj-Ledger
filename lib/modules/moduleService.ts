import { prisma } from "@/lib/prisma";
import { moduleCache } from "./moduleCache";

/**
 * Service to manage enabling and disabling of ERP modules per company.
 */
export class ModuleService {
  /**
   * Retrieves all available ERP modules registered in the system.
   */
  static async listAvailableModules() {
    return await prisma.module.findMany();
  }

  /**
   * Retrieves the currently active modules for a given company.
   */
  static async listActiveModules(companyId: string): Promise<string[]> {
    // 1. Check Cache
    const cached = moduleCache.get(companyId);
    if (cached && cached.size > 0) {
      return Array.from(cached);
    }

    // 2. Fetch from DB
    let activeModules = await prisma.companyModule.findMany({
      where: {
        companyId,
        isActive: true
      },
      include: {
        module: true
      }
    });

    // Auto-heal missing modules for existing companies
    if (activeModules.length === 0) {
      console.log(`Auto-healing missing modules for company ${companyId}`);
      const defaultModules = [
        { key: "ATTENDANCE", name: "Attendance" },
        { key: "HRM", name: "HR Management" },
        { key: "PAYROLL", name: "Payroll" },
        { key: "CRM", name: "Customer Relationship" },
        { key: "ACCOUNTING", name: "Accounting & Finance" },
        { key: "PROJECTS", name: "Project Management" },
        { key: "ESS", name: "Employee Self Service" },
        { key: "INVENTORY", name: "Inventory" },
        { key: "PURCHASE", name: "Purchase" },
        { key: "SALES", name: "Sales" },
        { key: "LEAD_MANAGEMENT", name: "Lead Management" }
      ];

      for (const mod of defaultModules) {
        await prisma.module.upsert({
          where: { key: mod.key },
          update: { name: mod.name },
          create: { key: mod.key, name: mod.name }
        });
      }

      const allMods = await prisma.module.findMany();
      for (const m of allMods) {
        await prisma.companyModule.upsert({
          where: { companyId_moduleId: { companyId, moduleId: m.id } },
          update: { isActive: true },
          create: { companyId, moduleId: m.id, isActive: true }
        });
      }

      // Re-fetch after healing
      activeModules = await prisma.companyModule.findMany({
        where: { companyId, isActive: true },
        include: { module: true }
      });
    }

    const activeKeys = activeModules.map(cm => cm.module.key);

    // 3. Update Cache
    moduleCache.set(companyId, activeKeys);

    return activeKeys;
  }

  /**
   * Enables a specific module for a company.
   */
  static async enableModule(companyId: string, moduleKey: string) {
    const module = await prisma.module.findUnique({
      where: { key: moduleKey }
    });

    if (!module) {
      throw new Error(`Module ${moduleKey} does not exist in the system.`);
    }

    const companyModule = await prisma.companyModule.upsert({
      where: {
        companyId_moduleId: {
          companyId,
          moduleId: module.id
        }
      },
      update: {
        isActive: true
      },
      create: {
        companyId,
        moduleId: module.id,
        isActive: true
      }
    });

    // Invalidate cache since the modules list changed
    moduleCache.invalidate(companyId);

    return companyModule;
  }

  /**
   * Disables a specific module for a company.
   */
  static async disableModule(companyId: string, moduleKey: string) {
    const module = await prisma.module.findUnique({
      where: { key: moduleKey }
    });

    if (!module) {
      throw new Error(`Module ${moduleKey} does not exist in the system.`);
    }

    const companyModule = await prisma.companyModule.upsert({
      where: {
        companyId_moduleId: {
          companyId,
          moduleId: module.id
        }
      },
      update: {
        isActive: false
      },
      create: {
        companyId,
        moduleId: module.id,
        isActive: false
      }
    });

    // Invalidate cache
    moduleCache.invalidate(companyId);

    return companyModule;
  }
}
