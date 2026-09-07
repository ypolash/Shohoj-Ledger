const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultModules = [
  { key: "ATTENDANCE", name: "Attendance" },
  { key: "HRM", name: "HR Management" },
  { key: "PAYROLL", name: "Payroll" },
  { key: "CRM", name: "Customer Relationship" },
  { key: "FINANCE", name: "Finance" },
  { key: "PROJECT", name: "Project Management" },
  { key: "ESS", name: "Employee Self Service" }
];

async function main() {
  console.log("Seeding platform modules...");
  
  for (const mod of defaultModules) {
    await prisma.module.upsert({
      where: { key: mod.key },
      update: { name: mod.name },
      create: { key: mod.key, name: mod.name }
    });
  }

  const modules = await prisma.module.findMany();
  console.log("Seeded modules:", modules.length);

  console.log("Enabling modules for all companies...");
  const companies = await prisma.company.findMany();

  for (const company of companies) {
    for (const mod of modules) {
      await prisma.companyModule.upsert({
        where: {
          companyId_moduleId: {
            companyId: company.id,
            moduleId: mod.id
          }
        },
        update: { isActive: true },
        create: {
          companyId: company.id,
          moduleId: mod.id,
          isActive: true
        }
      });
    }
  }

  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
