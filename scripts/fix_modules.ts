import { prisma } from "../lib/prisma";

async function main() {
  console.log("Fixing modules for all companies...");
  
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
  const companies = await prisma.company.findMany();

  for (const company of companies) {
    for (const m of allMods) {
      await prisma.companyModule.upsert({
        where: { companyId_moduleId: { companyId: company.id, moduleId: m.id } },
        update: { isActive: true },
        create: { companyId: company.id, moduleId: m.id, isActive: true }
      });
    }
    console.log(`Enabled all default modules for company: ${company.name}`);
  }

  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
