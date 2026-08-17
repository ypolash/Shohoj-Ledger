import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const companyId = await prisma.company.findFirst().then(c => c.id);
    console.log("Company:", companyId);
    
    const ledgers = await prisma.ledgerEntry.findMany({
      where: { companyId },
      orderBy: { date: 'desc' }
    });
    console.log("=== LEDGER ENTRIES ===");
    for (const l of ledgers) {
      console.log(`[${l.module}] Acc: ${l.accountType} | Debit: ${l.debit} | Credit: ${l.credit} | Net: ${Number(l.debit) - Number(l.credit)}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
