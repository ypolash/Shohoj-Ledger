const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const modules = await prisma.module.findMany();
  console.log("Modules:");
  console.log(modules);
  const companyModules = await prisma.companyModule.findMany({ include: { module: true }});
  console.log("Company Modules:");
  console.log(companyModules);
}
main().catch(console.error).finally(() => prisma.$disconnect());
