import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settlements = await prisma.settlement.findMany();
  console.log("Settlements:", settlements);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
