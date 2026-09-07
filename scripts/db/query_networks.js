const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const networks = await prisma.allowedNetwork.findMany();
  console.log("Networks:", networks);
}
main().catch(console.error).finally(() => prisma.$disconnect());
