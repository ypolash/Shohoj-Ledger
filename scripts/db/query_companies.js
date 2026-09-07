const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const companies = await prisma.company.findMany();
  console.log("Companies:");
  console.log(companies);
}
main().catch(console.error).finally(() => prisma.$disconnect());
