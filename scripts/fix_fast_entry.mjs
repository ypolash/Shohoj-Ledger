import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.ledgerEntry.updateMany({
      where: { accountType: 'Fast Entry' },
      data: { accountType: 'CASH' }
    });
    console.log("Updated Fast Entry to CASH in Ledger");

    await prisma.income.updateMany({
      where: { source: 'Fast Entry' },
      data: { source: 'CASH' }
    });
    console.log("Updated Fast Entry to CASH in Income");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
