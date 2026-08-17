import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const ledgers = await prisma.ledgerEntry.findMany();
    for (const l of ledgers) {
      console.log(`Company: ${l.companyId} | [${l.module}] Acc: ${l.accountType} | Debit: ${l.debit} | Credit: ${l.credit}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
