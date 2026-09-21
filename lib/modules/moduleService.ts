import { prisma } from "@/lib/prisma";
import { moduleCache } from "./moduleCache";

export const SYSTEM_DEFAULT_MODULES = [
  { key: "ACCOUNTING", name: "Accounting & Finance", description: "Income, expenses, ledger, loans, advances, bank accounts, and financial reporting." },
  { key: "ATTENDANCE", name: "Attendance & Leaves", description: "Biometric attendance, shift tracking, geo-fencing, and leave requests." },
  { key: "HRM", name: "HR Management", description: "Employee lifecycle, departments, designations, and document compliance." },
  { key: "PAYROLL", name: "Payroll & Compensation", description: "Salary structures, payslips, deductions, bonuses, and disbursements." },
  { key: "CRM", name: "Customer Relationship", description: "Clients, customer portal, invoices, and communication." },
  { key: "PROJECTS", name: "Project Management", description: "Multi-stage workflows, tasks, milestones, deliverables, and production tracking." },
  { key: "LEAD_MANAGEMENT", name: "Lead Management & Sales Pipeline", description: "Lead tracking, pipeline stages, conversions, and activities." },
  { key: "INVENTORY", name: "Inventory & Warehousing", description: "Stock management, product variants, warehouses, and SKU tracking." },
  { key: "PURCHASE", name: "Purchase & Vendor Management", description: "Purchase orders, vendor bills, and supplier ledger." },
  { key: "SALES", name: "Sales & POS", description: "Sales orders, point of sale, customer receipts, and delivery notes." },
  { key: "ESS", name: "Employee Self Service", description: "Mobile portal for attendance, leaves, and payslips." }
];

/**
 * Service to manage enabling and disabling of ERP modules per company.
 */
export class ModuleService {
  /**
   * Retrieves all available ERP modules registered in the system.
   */
  static async listAvailableModules() {
    // Ensure all default system modules exist in DB
    for (const mod of SYSTEM_DEFAULT_MODULES) {
      await prisma.module.upsert({
        where: { key: mod.key },
        update: { name: mod.name, description: mod.description },
        create: { key: mod.key, name: mod.name, description: mod.description }
      });
    }
    return await prisma.module.findMany({ orderBy: { name: 'asc' } });
  }

  /**
   * Retrieves the currently active modules for a given company.
   * Automatically heals/provisions any missing system modules for the company.
   */
  static async listActiveModules(companyId: string): Promise<string[]> {
    if (!companyId) return [];

    // 1. Check Cache
    const cached = moduleCache.get(companyId);
    if (cached && cached.size > 0) {
      return Array.from(cached);
    }

    // 2. Ensure system modules exist in DB catalog
    for (const mod of SYSTEM_DEFAULT_MODULES) {
      await prisma.module.upsert({
        where: { key: mod.key },
        update: { name: mod.name, description: mod.description },
        create: { key: mod.key, name: mod.name, description: mod.description }
      });
    }

    const allSystemModules = await prisma.module.findMany();

    // 3. Fetch all company module records (both active and inactive)
    let companyModules = await prisma.companyModule.findMany({
      where: { companyId },
      include: { module: true }
    });

    // 4. Auto-provision any system modules that have never been configured for this company
    const configuredModuleIds = new Set(companyModules.map(cm => cm.moduleId));
    const missingModules = allSystemModules.filter(m => !configuredModuleIds.has(m.id));

    if (missingModules.length > 0) {
      for (const m of missingModules) {
        await prisma.companyModule.upsert({
          where: { companyId_moduleId: { companyId, moduleId: m.id } },
          update: {}, // preserve existing if raced
          create: { companyId, moduleId: m.id, isActive: true }
        });
      }

      // Re-fetch full records
      companyModules = await prisma.companyModule.findMany({
        where: { companyId },
        include: { module: true }
      });
    }

    // 5. Collect active module keys with alias resolution
    const activeKeysSet = new Set<string>();
    for (const cm of companyModules) {
      if (cm.isActive && cm.module?.key) {
        const key = cm.module.key.toUpperCase();
        activeKeysSet.add(key);

        // Aliases
        if (key === "ACCOUNTING" || key === "FINANCE") {
          activeKeysSet.add("ACCOUNTING");
          activeKeysSet.add("FINANCE");
        }
        if (key === "PROJECTS" || key === "PROJECT") {
          activeKeysSet.add("PROJECTS");
          activeKeysSet.add("PROJECT");
        }
      }
    }

    const activeKeys = Array.from(activeKeysSet);

    // 6. Update Cache
    moduleCache.set(companyId, activeKeys);

    return activeKeys;
  }

  /**
   * Enables a specific module for a company.
   */
  static async enableModule(companyId: string, moduleKey: string) {
    const upperKey = moduleKey.toUpperCase();
    let module = await prisma.module.findUnique({
      where: { key: upperKey }
    });

    if (!module) {
      // Find matching default definition
      const def = SYSTEM_DEFAULT_MODULES.find(m => m.key === upperKey) || {
        key: upperKey,
        name: upperKey,
        description: `${upperKey} Module`
      };
      module = await prisma.module.create({
        data: { key: def.key, name: def.name, description: def.description }
      });
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

    // Invalidate cache
    moduleCache.invalidate(companyId);

    return companyModule;
  }

  /**
   * Disables a specific module for a company.
   */
  static async disableModule(companyId: string, moduleKey: string) {
    const upperKey = moduleKey.toUpperCase();
    let module = await prisma.module.findUnique({
      where: { key: upperKey }
    });

    if (!module) {
      const def = SYSTEM_DEFAULT_MODULES.find(m => m.key === upperKey) || {
        key: upperKey,
        name: upperKey,
        description: `${upperKey} Module`
      };
      module = await prisma.module.create({
        data: { key: def.key, name: def.name, description: def.description }
      });
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
